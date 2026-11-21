"""Chapter 17: backpropagation, and the first complete training loop."""
import numpy as np


def spiral(per_class, classes, rng, noise=0.3):
    """Points along interleaved spiral arms, one arm per class."""
    X = np.zeros((per_class * classes, 2))
    y = np.zeros(per_class * classes, dtype=int)
    for label in range(classes):
        rows = range(per_class * label, per_class * (label + 1))
        radius = np.linspace(0, 1, per_class)
        angle = label * 2 * np.pi / classes + radius * 3 * np.pi + noise * rng.standard_normal(per_class)
        X[rows] = np.c_[radius * np.sin(angle), radius * np.cos(angle)]
        y[rows] = label
    return X, y


class Layer_Dense:
    def __init__(self, n_inputs, n_neurons, rng):
        self.weights = 0.01 * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))

    def forward(self, inputs):
        self.inputs = inputs                               # remembered for the backward pass
        self.output = inputs @ self.weights + self.biases

    def backward(self, dvalues):
        # dvalues is the gradient of the loss with respect to this layer's output.
        self.dweights = self.inputs.T @ dvalues            # each weight: its input times the gradient
        self.dbiases = np.sum(dvalues, axis=0, keepdims=True)
        self.dinputs = dvalues @ self.weights.T            # passed back to the previous layer


class Activation_ReLU:
    def forward(self, inputs):
        self.inputs = inputs
        self.output = np.maximum(0, inputs)

    def backward(self, dvalues):
        self.dinputs = dvalues.copy()
        self.dinputs[self.inputs <= 0] = 0                 # slope is 0 where the input was negative


class Activation_Softmax_Loss_CategoricalCrossentropy:
    """Softmax and cross-entropy together, because their combined gradient is so simple."""

    def forward(self, inputs, y_true):
        exp_values = np.exp(inputs - np.max(inputs, axis=1, keepdims=True))
        self.output = exp_values / np.sum(exp_values, axis=1, keepdims=True)
        correct = np.clip(self.output[range(len(inputs)), y_true], 1e-7, 1)
        return np.mean(-np.log(correct))

    def backward(self, y_true):
        samples = len(self.output)
        self.dinputs = self.output.copy()
        self.dinputs[range(samples), y_true] -= 1          # probabilities minus the one-hot truth
        self.dinputs /= samples                            # average over the batch


class Optimizer_SGD:
    def __init__(self, learning_rate=1.0):
        self.learning_rate = learning_rate

    def update_params(self, layer):
        layer.weights -= self.learning_rate * layer.dweights
        layer.biases -= self.learning_rate * layer.dbiases


# --- One neuron by hand, as in the chapter's first figure ---------------------------------------
x, target, w, b = 2.0, 5.0, 0.5, 0.5
z = w * x + b                      # 1.5
a = max(0.0, z)                    # 1.5
loss = (a - target) ** 2           # 12.25
d_a = 2 * (a - target)             # -7.0
d_z = d_a * (1.0 if z > 0 else 0)  # -7.0
d_w, d_b = d_z * x, d_z            # -14.0, -7.0
print(loss, d_w, d_b)              # 12.25 -14.0 -7.0
w, b = w - 0.05 * d_w, b - 0.05 * d_b
print(round((max(0.0, w * x + b) - target) ** 2, 2))      # 3.06: the loss after one update

# --- The training loop on the spiral -------------------------------------------------------------
rng = np.random.default_rng(0)
X, y = spiral(100, 3, rng)

dense1 = Layer_Dense(2, 64, rng)
activation1 = Activation_ReLU()
dense2 = Layer_Dense(64, 3, rng)
loss_activation = Activation_Softmax_Loss_CategoricalCrossentropy()
optimizer = Optimizer_SGD(learning_rate=1.0)

for epoch in range(10001):
    # Forward pass
    dense1.forward(X)
    activation1.forward(dense1.output)
    dense2.forward(activation1.output)
    loss = loss_activation.forward(dense2.output, y)

    if epoch % 2000 == 0:
        accuracy = np.mean(np.argmax(loss_activation.output, axis=1) == y)
        print(f"epoch {epoch:5d}  loss {loss:.3f}  accuracy {accuracy:.2f}")

    # Backward pass, last layer first
    loss_activation.backward(y)
    dense2.backward(loss_activation.dinputs)
    activation1.backward(dense2.dinputs)
    dense1.backward(activation1.dinputs)

    # Update
    optimizer.update_params(dense1)
    optimizer.update_params(dense2)
