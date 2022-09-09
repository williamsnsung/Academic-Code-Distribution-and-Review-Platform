import java.io.IOException;
import java.util.Random;

import javax.lang.model.util.ElementScanner6;

import org.jblas.DoubleMatrix;
import org.jblas.util.Logger;

import minet.Dataset;
import minet.layer.*;
import minet.loss.CrossEntropy;
import minet.loss.Loss;
import minet.optim.Optimizer;
import minet.optim.SGD;
import minet.util.Pair;

public class ANN {

	Layer model;
	
	public ANN(){
		this.model = null;
	}

	/** 
     * calculate classification accuracy of a trained ANN on a given dataset.
	 * @param data a dataset	 
     * @return the classification accuracy value (float, in the range of [0,1])
    */
	public double eval(Dataset data) throws Exception{		
		if (this.model==null){
			throw new Exception("ANN model must be built first");
		}

		double correct = 0;  // for counting how many predictions are correct

		// get X and Y from the dataset
		Pair<DoubleMatrix> d = data.getAllData();		

		// perform forward to compute Yhat, each row of whom is a distribution over the number of classes
		DoubleMatrix Yhat = this.model.forward(d.first);

		// count how many predictions are correct
		int[] predictedLabels = Yhat.rowArgmaxs();			
		for (int i=0; i< predictedLabels.length; i++)
			if (predictedLabels[i] == (int) d.second.get(i,0))
				correct++;					

		// compute accuracy
		double acc = correct / data.getSize();
		return acc;
	}
	
	/** 
     * train an ANN
	 * @param loss a loss function object
	 * @param optimizer the optimizer used for updating the model's weights (currently only SGD is supported)
	 * @param traindata training dataset
	 * @param devdata validation dataset (also called development dataset), used for early stopping
	 * @param batchsize size of each minibatch during training
	 * @param nEpochs the maximum number of training epochs
	 * @param patience the maximum number of consecutive epochs where validation performance is allowed to non-increased, used for early stopping
	 * @param rnd a random generator (for reproducibility)     
    */
	public Layer train(Loss loss, Optimizer optimizer, Dataset traindata,
            Dataset devdata, int batchsize, int nEpochs, int patience, Random rnd) throws Exception{
		if (this.model==null){
			throw new Exception("ANN model must be built first");
		}

        System.out.println("Training...");
		int notAtPeak = 0;  // the number of times not at peak
		double peakAcc = -1;  // the best accuracy of the previous epochs
		double totalLoss = 0;  // the total loss of the current epoch

		for (int e = 0; e < nEpochs; e++) {
			System.out.printf("epoch %4d\t", e);
			traindata.shuffle(rnd);  // always shuffle the data before each epoch.
			totalLoss = 0;

			while (true) {
				Pair<DoubleMatrix> batch = traindata.getNextMiniBatch(batchsize);  // get the next mini-batch
				if (batch == null)  // finish this epoch if there are no items left
					break;

				optimizer.resetGradients();  // always reset the gradients before performing backward

				// calculate the loss value												
				DoubleMatrix probs = model.forward(batch.first);								
				double lossVal = loss.forward(batch.second, probs);

				// calculate network weights' gradients using backprop 
				this.model.backward(loss.backward());

				// update network weights using the calculated gradients
				optimizer.updateWeights();

				//System.out.printf("loss: %f\r", lossVal);
				totalLoss += lossVal;
			}
			System.out.printf("total loss: %5.3f\t", totalLoss);

			// check early stopping criteria
			double acc = this.eval(devdata);
            System.out.printf("accuracy: %3.3f \t", acc);
			if (acc <= peakAcc) {
				notAtPeak++;
				System.out.printf("Not at peak " + notAtPeak + " times consecutively");
			} else {
                notAtPeak = 0;
                peakAcc = acc;
            }
			if (notAtPeak >= patience)
				break;
			System.out.print('\r');
		}

		System.out.println("\ntraining is finished");

		return this.model;
	}

	/** 
     * build an (untrained) ANN for a classification task
	 * @param input_dims size of the input layer
	 * @param output_dim size of the output layer (number of output classes in a classification task)
	 * @param n_hidden_layers number of hidden layers
	 * @param n_nodes_per_hidden_layers number of nodes per hidden layer
	 * @param activation_function name of the activation function used in the hidden layers (ReLU/Sigmoid/Tanh)
    */
	public Layer build(int input_dims, int output_dims, int n_hidden_layers, int n_nodes_per_hidden_layer, String activation_function){		
		Layer model = null;

		//// YOUR CODE HERE		

		// print out the built model
		System.out.println("Built model: ");
		System.out.println(model);
		
		this.model = model;
		return model;
	}

	/** 
     * get the ANN model
	 * @return the current ANN model
    */
	public Layer getModel(){
		return this.model;
	}
}
