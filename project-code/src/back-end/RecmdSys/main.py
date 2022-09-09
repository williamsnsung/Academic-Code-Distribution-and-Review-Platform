import sys
import logging
import tensorflow as tf
import tensorflow_datasets as tfds
import numpy as np

import component.config as cfg
from component.util import CustomCallback
from component.dataset import Dataset, standardize_datetime
from component.model.movielens import MovieLensModel
from component.model.cs3099 import CS3099Model, QueryModel

tf.get_logger().setLevel(logging.ERROR)


def movie_lens(percentage: float):
    """
    Train MovieLens dataset model.
    """
    # load and split dataset
    split = f"train[:{int(percentage * 100)}%]"
    rating = tfds.load(cfg.MOVIELENS_RATING_SET, split=split)
    movies = tfds.load(cfg.MOVIELENS_MOVIES_SET, split=split)

    # choose the features we are interested in
    rating = rating.map(lambda x: {
        "movie_title": x["movie_title"],
        "user_id": x["user_id"],
        "user_rating": x["user_rating"],
        "user_gender": 1 if x["user_gender"] else 0,
        "timestamp": x["timestamp"],
        "user_occupation_label": x["user_occupation_label"],
        # "movie_genres": x["movie_genres"]
    })
    movies = movies.map(lambda x: x["movie_title"])

    # build Dataset and Model
    dataset = Dataset(rating=rating, submissions=movies)
    model = MovieLensModel(dataset, cfg.MODEL_DEPTH)
    model.compile(optimizer=tf.keras.optimizers.Adagrad(cfg.LEARNING_RATE))

    # train
    model.fit(
        dataset.train,
        validation_data=dataset.test,
        validation_freq=cfg.MOVIELENS_VALIDATE_FRE,
        epochs=cfg.MOVIELENS_EPOCHS,
        callbacks=[CustomCallback(plot=True)],
        verbose=0
    )


def cs3099(rs_root_path):
    """
    Train CS3099 dataset.
    """
    dataset = Dataset(rs_root_path + '/dataset')

    model = CS3099Model(dataset, cfg.MODEL_DEPTH)
    model.compile(optimizer=tf.keras.optimizers.Adagrad(cfg.LEARNING_RATE))

    model.fit(
        dataset.train,
        validation_data=dataset.test,
        validation_freq=cfg.CS3099_VALIDATE_FRE,
        epochs=cfg.CS3099_EPOCHS,
        callbacks=[CustomCallback()],
        verbose=0
    )

    query = QueryModel(model, dataset)
    query.save(rs_root_path + cfg.MODEL_SAVE_PATH)


def query_cs3099(path: str, k: int,
                 user_id: str, regis_date: str, gender: str, status: int):
    """
    Make prediction and query recommendations for specified user.
    """
    query = QueryModel()
    query.load(path)

    user = {
        "user_id": user_id,
        "regis_date": standardize_datetime(np.array(regis_date)),
        "gender": gender,
        "status": status,
    }

    for res in query.query(user, number=k):
        print(res)

    # FOR debug
    # result = query.query({
    #     "user_id": "0001019648",
    #     "regis_date": 6.290347,
    #     "gender": "male",
    #     "status": 0,
    #     "journal_id": "1647259-6f8v0w-679012Binary Search",
    #     "journal_title": "Binary Search",
    #     "voting": 2,
    #     "favourite": 2.0,
    #     "history": 53.390905,
    #     "tags": [np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, 1, 2, 8]
    # }, number=5)
    # print(result)


if __name__ == "__main__":

    def usage():
        print(sys.argv)
        print('usage: \n'
              'python3 main.py test                                  : Test with 100k MovieLens Dataset\n'
              'python3 main.py cs3099 <csv_root_path>                : Train CS3099 Recommender System\n'
              'python3 main.py query <path_to_model> <k> <user_info> : Get top k recommendations from model\n')


    try:
        arg = sys.argv[1]
        if arg == 'test':
            movie_lens(cfg.MOVIELENS_DATASET_SPLITRATE)
        elif arg == 'cs3099':
            cs3099(sys.argv[2])
        elif arg == 'query':
            model_path = sys.argv[2]
            top_k = int(sys.argv[3])

            uid = sys.argv[4]  # id
            rgd = sys.argv[5]  # register date
            gdr = sys.argv[6]  # gender
            sts = int(sys.argv[7])  # status

            query_cs3099(model_path, top_k, uid, rgd, gdr, sts)
        else:
            usage()
    except IndexError:
        usage()
