MOVIELENS_RATING_SET = "movielens/100k-ratings"
MOVIELENS_MOVIES_SET = "movielens/100k-movies"

SPLIT_RATIO = 0.8
BATCH_SIZE = 1_024
MAX_TOKEN = 10_000
EMBEDDING_DIMENSION = 32  # embedding_dimension
LINSPACE = 1_000

MODEL_DEPTH = [32]
LEARNING_RATE = 0.1

MOVIELENS_DATASET_SPLITRATE = 0.3
MOVIELENS_EPOCHS = 600
MOVIELENS_VALIDATE_FRE = int(MOVIELENS_EPOCHS / 100) if int(MOVIELENS_EPOCHS / 100) > 1 else 1

CS3099_EPOCHS = 50
CS3099_VALIDATE_FRE = 3
CS3099_MIN_JRNL_NUM = 10

MODEL_SAVE_PATH = '/save/query_tower'
VALIDATE_DATA_EXPORT_PATH = 'validation/'
