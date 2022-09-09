import tensorflow as tf

from component.model.model import Model


class TowerModel(Model):
    """Tower Model"""

    def __init__(self, embedding_model, layer_sizes):
        super().__init__()
        self.__embedding_model = embedding_model
        self.__dense_layers = None
        self.__layer_size = layer_sizes
        self.ready()

    def ready(self):
        self.__dense_layers = tf.keras.Sequential()

        # Commit to set ReLu depth as 0
        for layer_size in self.__layer_size[:-1]:
            self.__dense_layers.add(tf.keras.layers.Dense(layer_size, activation="relu"))

        for layer_size in self.__layer_size[-1:]:
            self.__dense_layers.add(tf.keras.layers.Dense(layer_size))

        # self.__dense_layers.add(tf.keras.layers.Softmax())

    def call(self, features):
        feature_embedding = self.__embedding_model(features)
        return self.__dense_layers(feature_embedding)
