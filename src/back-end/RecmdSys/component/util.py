import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
import csv
import component.config as cfg
import os


class CustomCallback(tf.keras.callbacks.Callback):
    """
    Customized Callback Class to visualize training process.
    """
    __symbols = ['-___', '_-__', '__-_', '___-']
    epoch = 0

    validated_epochs = []
    validated_total_loss = []
    validated_top100 = []
    validated_top50 = []
    validated_top10 = []
    validated_top5 = []

    def __init__(self, plot=False):
        super().__init__()
        self.plot = plot

    def __flush_print(self, string: str):
        print("\r", end='')
        print(string, end='', flush=True)

    @tf.function
    def on_train_batch_begin(self, batch, logs=None):
        return
        # s = self.__symbols[batch % len(self.__symbols)]
        # self.__flush_print("{} Epoch {:4d} Batch {:4d}".format(s, self.epoch, batch))

    @tf.function
    def on_epoch_end(self, epoch: int, logs=None):
        self.epoch = epoch
        keys = list(logs.keys())

        if 'val_total_loss' in keys:
            val_total_los = logs['val_total_loss']
            val_top5_acc = logs['val_factorized_top_k/top_5_categorical_accuracy']
            val_top10_acc = logs['val_factorized_top_k/top_10_categorical_accuracy']
            val_top50_acc = logs['val_factorized_top_k/top_50_categorical_accuracy']
            val_top100_acc = logs['val_factorized_top_k/top_50_categorical_accuracy']

            self.validated_epochs.append(epoch)
            self.validated_total_loss.append(val_total_los)
            self.validated_top100.append(val_top100_acc)
            self.validated_top50.append(val_top50_acc)
            self.validated_top10.append(val_top10_acc)
            self.validated_top5.append(val_top5_acc)

            s = self.__symbols[epoch % len(self.__symbols)]
            self.__flush_print("{} Epoch {} > top5_acc {:.5f} top10_acc {:.5f} top_50_acc {:.5f} val_top100_acc {:.5f} "
                               "total_loss {} "
                               .format(s, epoch, val_top5_acc, val_top10_acc, val_top50_acc, val_top100_acc,
                                       val_total_los))

    @tf.function
    def on_train_begin(self, logs=None):
        print("Training start")

    @tf.function
    def on_train_end(self, logs=None):
        print("\nTraining complete: data exported to csv")

        try:
            os.mkdir(cfg.VALIDATE_DATA_EXPORT_PATH)
        except:
            pass

        with open(cfg.VALIDATE_DATA_EXPORT_PATH + 'vali.csv', 'w') as f:
            wr = csv.writer(f)
            for i in range(len(self.validated_epochs)):
                wr.writerow([
                    self.validated_epochs[i],
                    self.validated_top10[i],
                    self.validated_top100[i],
                    self.validated_total_loss[i]
                ])

        if self.plot:
            _draw_plot(self.validated_epochs,
                       self.validated_top5,
                       self.validated_top10,
                       self.validated_top50,
                       self.validated_top100)


def _draw_plot(epochs, top5, top10, top50, top100):
    def add_subplot(ax, x, y, label, color):
        ax.plot(x, y, label=label, color=color)
        min_y, max_y = min(y), max(y)
        step = (max_y - min_y) / 5.0
        if step > 0:
            ax.set_yticks(np.arange(min_y, max_y, step))
        ax.legend()

    fig, axs = plt.subplots(4, sharex=True)
    add_subplot(axs[0], epochs, top100, "top-100", 'red')
    add_subplot(axs[1], epochs, top50, "top-50", 'green')
    add_subplot(axs[2], epochs, top10, "top-10", 'orange')
    add_subplot(axs[3], epochs, top5, "top-5", 'blue')

    fig.suptitle("Accuracy vs epoch")
    plt.xlabel("epoch")
    plt.show()
