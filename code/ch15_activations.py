"""Chapter 15: stacking layers, and the activation function that makes stacking worthwhile."""
import numpy as np


class Layer_Dense:
    def __init__(self, n_inputs, n_neurons, rng):
        self.weights = 0.01 * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))

    def forward(self, inputs):
        self.output = inputs @ self.weights + self.biases


class Activation_ReLU:
    """Negative values become zero; positive values pass through unchanged."""

    def forward(self, inputs):
        self.output = np.maximum(0, inputs)


# --- ReLU on a few numbers ---------------------------------------------------------------------
relu = Activation_ReLU()
relu.forward(np.array([[-2.0, -0.5, 0.0, 0.5, 2.0]]))
print(relu.output)                                   # [[0.  0.  0.  0.5 2. ]]

# --- Two linear layers with nothing between them are one linear layer -------------------------
x = np.array([[1.0], [2.0], [3.0]])
w1, b1, w2, b2 = 1.5, 1.0, -0.8, 2.0
two_layers = w2 * (w1 * x + b1) + b2
one_layer = (w2 * w1) * x + (w2 * b1 + b2)
print(np.allclose(two_layers, one_layer))            # True

# --- One hidden ReLU neuron makes a hinge ------------------------------------------------------
xs = np.linspace(-3, 3, 7).reshape(-1, 1)
hinge = np.maximum(0, 1.0 * xs + 1.0)                # kink at x = -b / w = -1
print(hinge.ravel())                                 # [0. 0. 0. 1. 2. 3. 4.]

# --- A two-layer network on a batch ------------------------------------------------------------
rng = np.random.default_rng(0)
batch = rng.standard_normal((5, 2))                  # 5 examples, 2 features

hidden = Layer_Dense(2, 8, rng)                      # 2 inputs -> 8 hidden neurons
activation = Activation_ReLU()
output = Layer_Dense(8, 3, rng)                      # 8 hidden -> 3 outputs

hidden.forward(batch)
activation.forward(hidden.output)
output.forward(activation.output)

print(hidden.output.shape, output.output.shape)      # (5, 8) (5, 3)
print(int((activation.output == 0).sum()), "of", activation.output.size, "hidden values are zero")
