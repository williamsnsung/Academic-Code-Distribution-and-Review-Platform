import pandas as pd
import numpy as np
import tensorflow as tf
import component.config as cfg

USER_FN = "/user.csv"
VOTE_FN = "/vote.csv"
FAVR_FN = "/favr.csv"
POST_FN = "/post.csv"
JNRL_FN = "/jnrl.csv"
TAGS_FN = "/tags.csv"
HSTY_FN = "/hsty.csv"


def standardize_datetime(series) -> pd.Series:
    """
    Standardize datetime to float.
    """
    now = pd.to_datetime("now", utc=True).tz_localize(tz=None)
    past = pd.to_datetime(series).tz_localize(None)
    return (now - past) / np.timedelta64(1, 'D')


def _standardize_datetime(series: pd.Series) -> pd.Series:
    """
    Standardize datetime to float.
    """
    now = pd.to_datetime("now", utc=True).tz_localize(tz=None)
    past = pd.to_datetime(series).dt.tz_localize(None)
    return (now - past) / np.timedelta64(1, 'D')


class InvalidDataset(Exception):
    pass


class Dataset:
    def __init__(self, csv_root_path=None, rating=None, submissions=None, seed=42):
        pd.set_option('display.max_columns', None)  # Debug
        self.__split_ratio = cfg.SPLIT_RATIO
        self.__seed = seed

        # Copy constructor
        if rating is not None and submissions is not None:
            self.rating = rating
            self.submissions = submissions
            self.user_num = len(rating)
            self.jnrl_num = len(submissions)
            self.__check()
            self.__split()
            self.__cache()
            return

        # Parse CSV
        self.__user = pd.read_csv(csv_root_path + USER_FN)
        self.__vote = pd.read_csv(csv_root_path + VOTE_FN)
        self.__favr = pd.read_csv(csv_root_path + FAVR_FN)
        self.__jnrl = pd.read_csv(csv_root_path + JNRL_FN)
        self.__tags = pd.read_csv(csv_root_path + TAGS_FN)
        self.__hsty = pd.read_csv(csv_root_path + HSTY_FN)
        self.__post = pd.read_csv(csv_root_path + POST_FN)

        self.rating = None
        self.submissions = None
        self.train = None
        self.test = None

        self.user_num = len(self.__user.user_id.unique())  # total user num
        self.jnrl_num = len(self.__jnrl.journal_id.unique())  # total journal num
        self.__check()

        self.encoded_maps = {}

        self.__preprocess()

    def __preprocess(self):
        """Data preprocessing."""
        # self.__encode()

        # ################
        # standardize time
        self.__user.regis_date = _standardize_datetime(self.__user.regis_date)
        self.__hsty.accesstime = _standardize_datetime(self.__hsty.accesstime)

        # ###########
        # submissions

        self.submissions = pd.DataFrame([
            [j, np.array(self.__jnrl.loc[self.__jnrl.journal_id == j].post_id)]
            for j in self.__jnrl.journal_id.unique()
        ], columns=["journal_id", "post_id"])

        self.__encode_tags()

        self.submissions = self.submissions.merge(self.__jnrl[["journal_id", "journal_title"]].drop_duplicates())

        # ######
        # rating
        self.rating = self.__user.merge(self.submissions.copy(), how='cross')

        # history
        def_mean = lambda xs: sum([0 if x == [] else sum(x) for x in xs])
        self.rating["history"] = [
            def_mean(
                self.__hsty.loc[
                    (self.__hsty.post_id == p) & (self.__hsty.user_id == r.user_id)
                    ].accesstime.tolist()
                for p in r.post_id
            ) for i, r in self.rating.iterrows()
        ]

        # ######
        # voting
        self.rating["voting"] = [
            def_mean(
                self.__vote.loc[
                    (self.__vote.post_id == p) & (self.__vote.user_id == r.user_id)
                    ].voting.tolist()
                for p in r.post_id
            ) for i, r in self.rating.iterrows()
        ]

        # #########
        # favourite
        self.rating["favourite"] = [
            sum(
                self.__favr.loc[
                    (self.__favr.post_id == p) & (self.__favr.user_id == r.user_id)
                    ].size / self.__favr.columns.size
                for p in r.post_id
            ) for i, r in self.rating.iterrows()
        ]

        # self.__calculate_rating()
        self.__to_tf_dataset()
        self.__split()
        self.__cache()

    def __calculate_rating(self):
        """
        ABANDONED
        rating = voting + (favourite + 1) * ( 1 + 1 / (user_num * voting + 1) ) - 2
        """
        self.rating["rating"] = (self.rating.favourite + 1) * (1 + 1 / (self.user_num * self.rating.voting + 1))

    def __to_tf_dataset(self):
        """
        Convert Dataset to Tensorflow Dataset.
        """
        self.rating = tf.data.Dataset.from_tensor_slices({
            "user_id": self.rating.user_id,
            "regis_date": self.rating.regis_date,
            "gender": self.rating.gender,
            "status": self.rating.status,
            "journal_id": self.rating.journal_id,
            "tags": self.rating.tags.to_list(),
            "journal_title": self.rating.journal_title,
            "history": self.rating.history,
            "voting": self.rating.voting,
            "favourite": self.rating.favourite
        })

        self.submissions = tf.data.Dataset.from_tensor_slices({
            "journal_id": self.submissions.journal_id,
            "tags": self.submissions.tags.to_list(),
            "journal_title": self.submissions.journal_title
        })
        self.submissions = self.submissions.map(lambda x: x["journal_id"])
        # print(self.submissions)

    def __split(self):
        """Split dataset"""
        tf.random.set_seed(self.__seed)
        sample_num = len(self.rating)
        shuffled = self.rating.shuffle(sample_num, seed=self.__seed, reshuffle_each_iteration=False)

        train_num = int(self.__split_ratio * sample_num)
        test_num = sample_num - train_num

        self.train = shuffled.take(train_num)
        self.test = shuffled.skip(train_num).take(test_num)

    def __encode_tags(self):
        """One-hot encoding for tags"""
        unique_tags = self.__tags.tag_name.unique()
        self.tag_no = len(unique_tags)
        df_copy = self.submissions.copy()

        for t in unique_tags:
            df_copy[t] = 0

        for i, r in self.__tags.iterrows():
            df_copy.loc[df_copy.journal_id == r.journal_id, r.tag_name] = 1

        # Put One-Hot encoding results into one list
        tag_encoded = {x: i + 1 for i, x in enumerate(unique_tags)}

        def _all_tags(tags_):
            ts = [tag_encoded[t_] for t_, ut_ in zip(unique_tags, tags_) if ut_ == 1]
            return [np.nan] * (len(unique_tags) - len(ts)) + ts

        self.submissions["tags"] = [_all_tags(ts) for ts in zip(*[df_copy[t] for t in unique_tags])]

    def __encode(self):
        """Encode other features."""
        # Encode ids
        unique_users = self.__user.user_id.unique()
        unique_gndrs = self.__user.gender.unique()  # gender
        unique_jnrls = self.__jnrl.journal_id.unique()
        unique_posts = self.__jnrl.post_id.unique()

        gndr_map = self.encoded_maps["gender"] = {x: i for i, x in enumerate(unique_gndrs)}
        user_map = self.encoded_maps["user_id"] = {x: i for i, x in enumerate(unique_users)}
        post_map = self.encoded_maps["post_id"] = {x: i for i, x in enumerate(unique_posts)}
        jnrl_map = self.encoded_maps["jnrl_id"] = {x: i for i, x in enumerate(unique_jnrls)}

        self.__user["gender"] = self.__user["gender"].map(gndr_map)
        self.__user["user_id"] = self.__user["user_id"].map(user_map)
        self.__favr["user_id"] = self.__favr["user_id"].map(user_map)
        self.__vote["user_id"] = self.__vote["user_id"].map(user_map)
        self.__hsty["user_id"] = self.__hsty["user_id"].map(user_map)
        self.__favr["post_id"] = self.__favr["post_id"].map(post_map)
        self.__hsty["post_id"] = self.__hsty["post_id"].map(post_map)
        self.__jnrl["post_id"] = self.__jnrl["post_id"].map(post_map)
        self.__vote["post_id"] = self.__vote["post_id"].map(post_map)
        self.__jnrl["journal_id"] = self.__jnrl["journal_id"].map(jnrl_map)
        self.__tags["journal_id"] = self.__tags["journal_id"].map(jnrl_map)

    def __cache(self):
        """Cache dataset."""
        sample_num = len(self.rating)
        self.train = self.train.shuffle(sample_num).batch(cfg.BATCH_SIZE)
        self.test = self.test.batch(cfg.BATCH_SIZE).cache()

    def __check(self):
        """
        If the number of journals in dataset is less than CS3099_MIN_JRNL_NUM,
        we cannot perform meaningful recommendations.
        """
        if self.jnrl_num < cfg.CS3099_MIN_JRNL_NUM:
            raise InvalidDataset(
                "Unable to generate models when the number of journals is less than {}".format(cfg.CS3099_MIN_JRNL_NUM)
            )
