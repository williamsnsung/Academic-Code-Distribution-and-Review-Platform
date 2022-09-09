PYTHON := python3
PIP    := pip3
ENTRY  := main.py

.PHONY: run test install

all: run

run:
	$(PYTHON) $(ENTRY) cs3099 ./

test:
	$(PYTHON) $(ENTRY) test

install:
	$(PIP) install numpy
	$(PIP) install pandas
	$(PIP) install matplotlib
	$(PIP) install tensorflow
	$(PIP) install tensorflow-recommenders
	$(PIP) install tensorflow-datasets