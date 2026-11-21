"""Chapter 16: softmax turns scores into probabilities, and cross-entropy scores them."""
import numpy as np


class Layer_Dense:
    def __init__(self, n_inputs, n_neurons, rng):
        self.weights = 0.01 * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))

    def forward(self, inputs):
        self.output = inputs @ self.weights + self.biases


class Activation_ReLU:
    def forward(self, inputs):
        self.output = np.maximum(0, inputs)


class Activation_Softmax:
    """Turns each row of scores into probabilities that are positive and sum to 1."""

    def forward(self, inputs):
        # Subtracting each row's largest score first changes nothing mathematically
        # and stops the exponential from overflowing.
        exp_values = np.exp(inputs - np.max(inputs, axis=1, keepdims=True))
        self.output = exp_values / np.sum(exp_values, axis=1, keepdims=True)


class Loss_CategoricalCrossentropy:
    """Minus the log of the probability given to the correct class, averaged over the batch."""

    def calculate(self, probabilities, y_true):
        samples = len(probabilities)
        clipped = np.clip(probabilities, 1e-7, 1 - 1e-7)        # never take log(0)
        correct_confidences = clipped[range(samples), y_true]   # pick each row's correct class
        return np.mean(-np.log(correct_confidences))


# --- Softmax on the chapter's example ----------------------------------------------------------
softmax = Activation_Softmax()
softmax.forward(np.array([[2.0, 1.0, 0.1]]))
print(np.round(softmax.output, 3))                 # [[0.659 0.242 0.099]]
print(softmax.output.sum())                        # 1.0

# --- Cross-entropy for each possible correct class ---------------------------------------------
loss_function = Loss_CategoricalCrossentropy()
for correct in range(3):
    print(correct, round(loss_function.calculate(softmax.output, [correct]), 3))
# 0 0.417
# 1 1.417
# 2 2.317

# --- Same accuracy, different loss -------------------------------------------------------------
# Probability each model gave to the correct class, for three images. Each gets two right.
model_a = np.array([0.9, 0.8, 0.4])
model_b = np.array([0.55, 0.5, 0.3])
print(round(np.mean(-np.log(model_a)), 3), round(np.mean(-np.log(model_b)), 3))   # 0.415 0.832

# --- A network that knows nothing --------------------------------------------------------------
rng = np.random.default_rng(0)
X = rng.standard_normal((300, 2))                  # 300 examples, 2 features
y = rng.integers(0, 3, 300)                        # 3 classes

dense1 = Layer_Dense(2, 64, rng)
relu = Activation_ReLU()
dense2 = Layer_Dense(64, 3, rng)

dense1.forward(X)
relu.forward(dense1.output)
dense2.forward(relu.output)
softmax.forward(dense2.output)

loss = loss_function.calculate(softmax.output, y)
accuracy = np.mean(np.argmax(softmax.output, axis=1) == y)
print(round(loss, 3), round(np.log(3), 3))         # 1.099 1.099: an untrained network scores ln(3)
print(round(accuracy, 2))                          # 0.3: no better than guessing
