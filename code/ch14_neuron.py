"""Chapter 14: a single neuron, a layer of neurons, and a batch of examples."""
import numpy as np

# --- One neuron, written out longhand -------------------------------------------------------
inputs = [4, 7, 60]            # hours studied, hours slept, last test score
weights = [5, 2, 0.5]          # how much the neuron cares about each input
bias = 10                      # a head start that does not depend on the inputs

output = inputs[0] * weights[0] + inputs[1] * weights[1] + inputs[2] * weights[2] + bias
print(output)                  # 74.0

# --- The same neuron as a dot product ----------------------------------------------------------
print(np.dot(inputs, weights) + bias)            # 74.0

# --- A layer: three neurons looking at the same inputs ----------------------------------------
layer_weights = np.array([[5, 2, 0.5],           # one row of weights per neuron
                          [1, 6, 0.0],
                          [-2, 0, 1.0]])
layer_biases = np.array([10, -20, 0])

print(layer_weights @ inputs + layer_biases)     # [74. 26. 52.]

# --- A batch: several students at once -----------------------------------------------------------
batch = np.array([[4, 7, 60],                    # one row per student
                  [1, 5, 40],
                  [8, 8, 75]])

# Each row of the batch meets each neuron, giving one row of outputs per student.
print(batch @ layer_weights.T + layer_biases)
# [[ 74.   26.   52. ]
#  [ 45.   11.   38. ]
#  [103.5  36.   59. ]]


# --- The layer as a reusable object -------------------------------------------------------------
class Layer_Dense:
    """A fully connected layer: every input feeds every neuron."""

    def __init__(self, n_inputs, n_neurons, rng):
        # Small random starting weights, shape (inputs, neurons), so no transpose is needed later.
        self.weights = 0.01 * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))

    def forward(self, inputs):
        self.output = inputs @ self.weights + self.biases


rng = np.random.default_rng(0)
layer = Layer_Dense(3, 4, rng)                   # 3 inputs, 4 neurons
layer.forward(batch)
print(layer.output.shape)                        # (3, 4): 3 students, 4 neuron outputs each
