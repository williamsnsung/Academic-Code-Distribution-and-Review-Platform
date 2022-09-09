import tensorflow as tf
from abc import ABC
import numpy as np
import component.config as cfg


class Model(tf.keras.Model, ABC):
    """Abstract Model which encapsulates TensorFlow.Keras.Model"""
    EMBEDDING = cfg.EMBEDDING_DIMENSION  # embedding_dimension
    BATCH_SIZE = cfg.BATCH_SIZE
    MAX_TOKEN = cfg.MAX_TOKEN

    def __init__(self):
        super().__init__()

    def ready(self):
        raise NotImplementedError("Implementers must implement the `ready` method.")

    @staticmethod
    def normalization(feature):
        batched = np.concatenate(list(
            feature
        ))
        buckets = np.linspace(
            batched.min(),
            batched.max(),
            num=cfg.LINSPACE,
        )
        normalized = tf.keras.layers.Normalization(
            axis=None
        )
        normalized.adapt(batched)
        return buckets, normalized

    @staticmethod
    def contiguous_embedding(buckets):
        return tf.keras.Sequential([
            tf.keras.layers.Discretization(buckets.tolist()),
            tf.keras.layers.Embedding(len(buckets) + 1, Model.EMBEDDING),
        ])

    @staticmethod
    def integers_embedding(unique):
        return tf.keras.Sequential([
            tf.keras.layers.IntegerLookup(vocabulary=unique, mask_token=None),
            tf.keras.layers.Embedding(len(unique) + 1, Model.EMBEDDING),
        ])

    @staticmethod
    def strings_embedding(unique):
        return tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=unique, mask_token=None),
            tf.keras.layers.Embedding(len(unique) + 1, Model.EMBEDDING),
        ])
