"""Chapter 20: one network body, three output layers. And two old friends as one-neuron networks."""
import numpy as np


class Layer_Dense:
    def __init__(self, n_inputs, n_neurons, rng):
        self.weights = 0.01 * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))

    def forward(self, inputs):
        self.inputs = inputs
        self.output = inputs @ self.weights + self.biases

    def backward(self, dvalues):
        self.dweights = self.inputs.T @ dvalues
        self.dbiases = np.sum(dvalues, axis=0, keepdims=True)
        self.dinputs = dvalues @ self.weights.T


# --- Head 1: a yes/no answer ----------------------------------------------------------------------
class Activation_Sigmoid:
    def forward(self, inputs):
        self.output = 1 / (1 + np.exp(-inputs))

    def backward(self, dvalues):
        self.dinputs = dvalues * self.output * (1 - self.output)


class Loss_BinaryCrossentropy:
    def forward(self, y_pred, y_true):
        clipped = np.clip(y_pred, 1e-7, 1 - 1e-7)
        return np.mean(-(y_true * np.log(clipped) + (1 - y_true) * np.log(1 - clipped)))

    def backward(self, y_pred, y_true):
        clipped = np.clip(y_pred, 1e-7, 1 - 1e-7)
        self.dinputs = -(y_true / clipped - (1 - y_true) / (1 - clipped)) / y_true.size


# --- Head 2: a number -------------------------------------------------------------------------------
class Activation_Linear:
    """No activation at all: the output can be any number."""

    def forward(self, inputs):
        self.output = inputs

    def backward(self, dvalues):
        self.dinputs = dvalues.copy()


class Loss_MeanSquaredError:
    def forward(self, y_pred, y_true):
        return np.mean((y_true - y_pred) ** 2)

    def backward(self, y_pred, y_true):
        self.dinputs = -2 * (y_true - y_pred) / y_true.size


# (Head 3, one class out of several, is the softmax and cross-entropy pair from chapter 16.)


def train_one_neuron(x, y, activation, loss_function, learning_rate, steps):
    """A network with no hidden layer: one dense layer of one neuron, then the chosen head."""
    centre = x.mean()
    X = (x - centre).reshape(-1, 1)          # measure the input from its average, as in chapter 3
    Y = y.reshape(-1, 1).astype(float)
    layer = Layer_Dense(1, 1, np.random.default_rng(0))

    for _ in range(steps):
        layer.forward(X)
        activation.forward(layer.output)
        loss = loss_function.forward(activation.output, Y)

        loss_function.backward(activation.output, Y)
        activation.backward(loss_function.dinputs)
        layer.backward(activation.dinputs)

        layer.weights -= learning_rate * layer.dweights
        layer.biases -= learning_rate * layer.dbiases

    w = layer.weights[0, 0]
    b = layer.biases[0, 0] - w * centre      # convert back to plain hours
    return w, b, loss


# --- Old friend 1: linear regression is one neuron with no activation and squared error -----------
hours = np.array([1, 1.5, 2, 3, 3.5, 4, 5, 5.5, 6, 7, 8, 9])
score = np.array([48, 53, 50, 60, 57, 66, 68, 75, 71, 82, 83, 91])
w, b, loss = train_one_neuron(hours, score, Activation_Linear(), Loss_MeanSquaredError(), 0.05, 2000)
print(round(w, 2), round(b, 2), round(loss, 2))          # 5.31 42.44 6.13

# --- Old friend 2: logistic regression is one neuron with a sigmoid and cross-entropy -------------
hours = np.array([0.5, 1, 1.5, 2, 2.5, 3, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 8.5, 9])
passed = np.array([0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1])
w, b, loss = train_one_neuron(hours, passed, Activation_Sigmoid(), Loss_BinaryCrossentropy(), 1.0, 3000)
print(round(w, 2), round(b, 2), round(loss, 3))          # 1.56 -6.03 0.259
