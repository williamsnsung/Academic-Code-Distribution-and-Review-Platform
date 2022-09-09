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
        # gender
        self.__unique_gender = np.unique(np.concatenate(list(
            self.ds.rating
                .map(lambda x: x["gender"])
                .batch(1000)
        )))
        # status
        self.__unique_status = np.unique(np.concatenate(list(
            self.ds.rating
                .map(lambda x: x["status"])
                .batch(1000)
        )))

    def __normalization(self):
        # regis_date
        self.__rgst_buckets, self.__normalized_rgst = Model.normalization(
            self.ds.rating
                .map(lambda x: x["regis_date"])
                .batch(100)
        )
        # history
        self.__hsty_buckets, self.__normalized_hsty = Model.normalization(
            self.ds.rating
                .map(lambda x: x["history"])
                .batch(100)
        )
        # voting
        self.__vote_buckets, self.__normalized_vote = Model.normalization(
            self.ds.rating
                .map(lambda x: x["voting"])
                .batch(100)
        )
        # favourite
        self.__favr_buckets, self.__normalized_favr = Model.normalization(
            self.ds.rating
                .map(lambda x: x["favourite"])
                .batch(100)
        )

    def __embedding(self):
        self.__user_embedding = Model.strings_embedding(self.__unique_user_ids)
        self.__gndr_embedding = Model.strings_embedding(self.__unique_gender)
        self.__stat_embedding = Model.integers_embedding(self.__unique_status)
        self.__rgst_embedding = Model.contiguous_embedding(self.__rgst_buckets)
        self.__hsty_embedding = Model.contiguous_embedding(self.__hsty_buckets)
        self.__vote_embedding = Model.contiguous_embedding(self.__vote_buckets)
        self.__favr_embedding = Model.contiguous_embedding(self.__favr_buckets)

    @tf.function
    def call(self, features):
        # Take the input dictionary, pass it through each input layer,
        # and concatenate the result.
        reshape_shape = (-1, 1)
        return tf.concat([
            self.__user_embedding(features["user_id"]),
            self.__gndr_embedding(features["gender"]),
            self.__stat_embedding(features["status"]),
            self.__rgst_embedding(features["regis_date"]),
            tf.reshape(self.__normalized_rgst(features["regis_date"]), reshape_shape),
            self.__hsty_embedding(features["history"]),
            tf.reshape(self.__normalized_hsty(features["history"]), reshape_shape),
            self.__vote_embedding(features["voting"]),
            tf.reshape(self.__normalized_vote(features["voting"]), reshape_shape),
            self.__favr_embedding(features["favourite"]),
            tf.reshape(self.__normalized_favr(features["favourite"]), reshape_shape)
        ], axis=1)


class JournalModel(Model):
    def __init__(self, dataset: Dataset):
        super().__init__()
        self.ds = dataset
        self.ready()

    def __uniques(self):
        self.__unique_jnrl_ids = np.unique(np.concatenate(list(
            self.ds.submissions
                .batch(1000)
        )))

    def ready(self):
        self.__uniques()
        self.__embedding()

    def __embedding(self):
        self.__jnrl_id_embedding = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=self.__unique_jnrl_ids, mask_token=None),
            tf.keras.layers.Embedding(len(self.__unique_jnrl_ids) + 1, 32)
        ])

        self.__jnrl_id_vectorizer = tf.keras.layers.TextVectorization(max_tokens=10000)

        self.__jnrl_id_text_embedding = tf.keras.Sequential([
            self.__jnrl_id_vectorizer,
            tf.keras.layers.Embedding(10000, 32, mask_zero=True),
            tf.keras.layers.GlobalAveragePooling1D(),
        ])

        self.__jnrl_id_vectorizer.adapt(self.ds.submissions)

    @tf.function
    def call(self, features):
        jnrl_id = features
        return tf.concat([
            self.__jnrl_id_embedding(jnrl_id),
            self.__jnrl_id_text_embedding(jnrl_id),
        ], axis=1)


class CS3099Model(tfrs.models.Model):
    def __init__(self, dataset: Dataset, layer_sizes: int):
        super().__init__()

        self.query_model = TowerModel(UserModel(dataset), layer_sizes)
        self.candidate_model = TowerModel(JournalModel(dataset), layer_sizes)

        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=
                dataset.submissions.batch(128).map(self.candidate_model),
            ),
        )

    @tf.function
    def compute_loss(self, features, training: bool = False) -> tf.Tensor:
        query_embeddings = self.query_model({
            "journal_title": features["journal_title"],
            "user_id": features["user_id"],
            "regis_date": features["regis_date"],
            "gender": features["gender"],
            "status": features["status"],
            "history": features["history"],
            "voting": features["voting"],
            "favourite": features["favourite"]
        })
        movie_embeddings = self.candidate_model(
            features["journal_id"]
        )

        return self.task(query_embeddings, movie_embeddings, compute_metrics=not training)


class QueryModel:
    def __init__(self, model: CS3099Model = None, dataset: Dataset = None):
        if model is None or dataset is None:
            self.index = None
            return

        ttls = dataset.submissions.batch(100)
        self.index = tfrs.layers.factorized_top_k.BruteForce(model.query_model)
        self.index.index_from_dataset(
            tf.data.Dataset.zip(
                (ttls, ttls.map(model.candidate_model))
            )
        )
        self.tag_no = dataset.tag_no

        # build up
        for row in dataset.rating.batch(1).take(2):
            self.index(row)

    def save(self, path: str):
        tf.saved_model.save(self.index, path)
        with open(path + '/tags.value', 'w') as f:
            f.write(str(self.tag_no))

    def load(self, path: str):
        self.index = tf.saved_model.load(path)
        with open(path + '/tags.value') as f:
            self.tag_no = int(f.read())

    def query(self, user: dict, number: int):
        if self.index is None:
            return None

        user = QueryModel.__convert_model_input_format(
            user["user_id"],
            user["regis_date"],
            user["gender"],
            user["status"],
            self.tag_no
        )

        result = self.index(user)[1][0].numpy()
        number = number if number < len(result) else len(result)
        return [raw.decode("utf-8") for raw in result[:number]]

    @staticmethod
    def __convert_model_input_format(
            user_id: str,
            regis_date: float,
            gender: str,
            status: int,
            tags_no: int
    ):
        """
        Type is critical:
        {'journal_title': TensorSpec(shape=(None,), dtype=tf.string, name='journal_title'),
         'voting': TensorSpec(shape=(None,), dtype=tf.int64, name='voting'),
         'status': TensorSpec(shape=(None,), dtype=tf.int64, name='status'),
         'favourite': TensorSpec(shape=(None,), dtype=tf.float32, name='favourite'),
         'regis_date': TensorSpec(shape=(None,), dtype=tf.float32, name='regis_date'),
         'history': TensorSpec(shape=(None,), dtype=tf.float32, name='history'),
         'journal_id': TensorSpec(shape=(None,), dtype=tf.string, name='journal_id'),
         'user_id': TensorSpec(shape=(None,), dtype=tf.string, name='user_id'),
         'gender': TensorSpec(shape=(None,), dtype=tf.string, name='gender'),
         'tags': TensorSpec(shape=(None, 11), dtype=tf.float32, name='tags')
        }
        """
        return {
            "user_id": np.array([user_id]),
            "regis_date": np.array([regis_date], dtype="float32"),
            "gender": np.array([gender]),
            "status": np.array([status]),
            # masks
            "journal_id": np.array([""]),
            "journal_title": np.array([""]),
            "voting": np.array([0]),
            "favourite": np.array([0], dtype="float32"),
            "history": np.array([0], dtype="float32"),
            "tags": np.array([[np.nan] * tags_no], dtype="float32")
        }

        # Example of model input:
        # user = {
        #     "user_id": np.array(["0001019648"]),
        #     "regis_date": np.array([6.290347], dtype="float32"),
        #     "gender": np.array(["male"]),
        #     "status": np.array([0]),
        #     "journal_id": np.array(["1647259-6f8v0w-679012Binary Search"]),
        #     "journal_title": np.array(["Binary Search"]),
        #     "voting": np.array([0]),
        #     "favourite": np.array([2.0], dtype="float32"),
        #     "history": np.array([53.390905], dtype="float32"),
        #     "tags": np.array([[np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, 1, 2, 8]],
        #                      dtype="float32")
        # }
