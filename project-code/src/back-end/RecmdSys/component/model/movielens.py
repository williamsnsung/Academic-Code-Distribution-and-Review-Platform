import numpy as np
import tensorflow as tf
import tensorflow_recommenders as tfrs

from component.model.model import Model
from component.model.tower import TowerModel
from ..dataset import Dataset


class UserModel(Model):
    def __init__(self, dataset: Dataset):
        super().__init__()
        self.ds = dataset
        self.ready()

    def ready(self):
        self.__uniques()
        self.__normalization()
        self.__embedding()

    def __uniques(self):
        # user ids
        self.__unique_user_ids = np.unique(np.concatenate(list(
            self.ds.rating
                .map(lambda x: x["user_id"])
                .batch(1000)
        )))

        # occupation
        self.__unique_occupation = np.unique(np.concatenate(list(
            self.ds.rating
                .map(lambda x: x["user_occupation_label"])
                .batch(Model.BATCH_SIZE)
        )))

        # genres
        # self.__unique_genres = np.unique(np.concatenate(list(
        #     self.ds.rating
        #         .map(lambda x: x["movie_genres"])
        # )), axis=None)

    def __normalization(self):
        # timestamps
        self.__timestamp_buckets, self.__normalized_timestamp = Model.normalization(
            self.ds.rating
                .map(lambda x: x["timestamp"]).batch(100)
        )

        # rating
        self.__rating_buckets, self.__normalized_rating = Model.normalization(
            self.ds.rating
                .map(lambda x: x["user_rating"])
                .batch(100)
        )

    def __embedding(self):
        self.__user_embedding = Model.strings_embedding(self.__unique_user_ids)
        self.__gender_embedding = Model.integers_embedding(np.array([0, 1]))
        self.__occupation_embedding = Model.integers_embedding(self.__unique_occupation)
        self.__timestamp_embedding = Model.contiguous_embedding(self.__timestamp_buckets)
        self.__rating_embedding = Model.contiguous_embedding(self.__rating_buckets)
        # self.__genres_embedding = tf.keras.Sequential([
        #     tf.keras.layers.CategoryEncoding(
        #         num_tokens=len(self.__unique_genres), output_mode='multi_hot'
        #     ),
        #     tf.keras.layers.Embedding(len(self.__unique_genres) + 1, self.EMBEDDING)
        # ])

    @tf.function
    def call(self, features):
        return tf.concat([
            self.__user_embedding(features["user_id"]),
            self.__gender_embedding(features["user_gender"]),
            self.__occupation_embedding(features["user_occupation_label"]),
            self.__rating_embedding(features["user_rating"]),
            tf.reshape(self.__normalized_rating(features["user_rating"]), (-1, 1)),
            # tf.reshape(self.__genres_embedding(features["movie_genres"]), (-1, 32)),
            self.__timestamp_embedding(features["timestamp"]),
            tf.reshape(self.__normalized_timestamp(features["timestamp"]), (-1, 1)),
        ], axis=1)


class MovieModel(Model):
    def __init__(self, dataset: Dataset):
        super().__init__()
        self.ds = dataset
        self.ready()

    def ready(self):
        self.__uniques()
        self.__embedding()

    def __uniques(self):
        self.__unique_movie_ttl = np.unique(np.concatenate(list(
            self.ds.submissions
                .batch(1000)
        )))

    def __embedding(self):
        self.__ttl_embedding = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=self.__unique_movie_ttl, mask_token=None),
            tf.keras.layers.Embedding(len(self.__unique_movie_ttl) + 1, 32)
        ])

        self.__title_vectorizer = tf.keras.layers.TextVectorization(max_tokens=10000)

        self.__ttl_text_embedding = tf.keras.Sequential([
            self.__title_vectorizer,
            tf.keras.layers.Embedding(10000, 32, mask_zero=True),
            tf.keras.layers.GlobalAveragePooling1D(),
        ])

        self.__title_vectorizer.adapt(self.ds.submissions)

    @tf.function
    def call(self, features):
        return tf.concat([
            self.__ttl_embedding(features),
            self.__ttl_text_embedding(features),
        ], axis=1)


class MovieLensModel(tfrs.models.Model):
    def __init__(self, dataset: Dataset, layer_sizes):
        super().__init__()

        self.query_model = TowerModel(UserModel(dataset), layer_sizes)
        self.candidate_model = TowerModel(MovieModel(dataset), layer_sizes)

        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=
                dataset.submissions.batch(128).map(self.candidate_model),
            ),
        )

    @tf.function
    def compute_loss(self, features, training: bool = False) -> tf.Tensor:
        query_embeddings = self.query_model({
            "movie_title": features["movie_title"],
            "user_id": features["user_id"],
            "user_rating": features["user_rating"],
            "user_gender": features["user_gender"],
            "timestamp": features["timestamp"],
            "user_occupation_label": features["user_occupation_label"],
            # "movie_genres": features["movie_genres"]
        })
        movie_embeddings = self.candidate_model(features["movie_title"])

        return self.task(query_embeddings, movie_embeddings, compute_metrics=not training)
