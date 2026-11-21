"""Chapter 19: keeping a network honest with weight penalties and dropout."""
import numpy as np


def spiral(per_class, classes, rng, noise=0.3):
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
    def __init__(self, n_inputs, n_neurons, rng, weight_regularizer_l2=0.0):
        self.weights = np.sqrt(2 / n_inputs) * rng.standard_normal((n_inputs, n_neurons))
        self.biases = np.zeros((1, n_neurons))
        self.weight_regularizer_l2 = weight_regularizer_l2

    def forward(self, inputs):
        self.inputs = inputs
        self.output = inputs @ self.weights + self.biases

    def backward(self, dvalues):
        self.dweights = self.inputs.T @ dvalues
        self.dbiases = np.sum(dvalues, axis=0, keepdims=True)
        # The penalty l2 * sum(w^2) adds 2 * l2 * w to each weight's gradient,
        # a steady pull toward zero.
        if self.weight_regularizer_l2 > 0:
            self.dweights += 2 * self.weight_regularizer_l2 * self.weights
        self.dinputs = dvalues @ self.weights.T

    def regularization_loss(self):
        return self.weight_regularizer_l2 * np.sum(self.weights ** 2)


class Layer_Dropout:
    """Switches off a random share of the values during training, and scales the rest up."""

    def __init__(self, rate, rng):
        self.keep = 1 - rate
        self.rng = rng

    def forward(self, inputs, training):
        if not training:
            self.output = inputs                      # prediction: every neuron takes part
            return
        # Dividing by the keep rate leaves the expected total unchanged.
        self.mask = self.rng.binomial(1, self.keep, size=inputs.shape) / self.keep
        self.output = inputs * self.mask

    def backward(self, dvalues):
        self.dinputs = dvalues * self.mask            # dropped neurons get no gradient


class Activation_ReLU:
    def forward(self, inputs):
        self.inputs = inputs
        self.output = np.maximum(0, inputs)

    def backward(self, dvalues):
        self.dinputs = dvalues.copy()
        self.dinputs[self.inputs <= 0] = 0


class Activation_Softmax_Loss_CategoricalCrossentropy:
    def forward(self, inputs, y_true):
        exp_values = np.exp(inputs - np.max(inputs, axis=1, keepdims=True))
        self.output = exp_values / np.sum(exp_values, axis=1, keepdims=True)
        return np.mean(-np.log(np.clip(self.output[range(len(inputs)), y_true], 1e-7, 1)))

    def backward(self, y_true):
        samples = len(self.output)
        self.dinputs = self.output.copy()
        self.dinputs[range(samples), y_true] -= 1
        self.dinputs /= samples


class Optimizer_Adam:
    def __init__(self, learning_rate=0.03, epsilon=1e-7, beta_1=0.9, beta_2=0.999):
        self.learning_rate, self.epsilon, self.beta_1, self.beta_2 = learning_rate, epsilon, beta_1, beta_2
        self.iterations = 0

    def update_params(self, layer):
        if not hasattr(layer, "weight_cache"):
            layer.weight_momentums, layer.weight_cache = np.zeros_like(layer.weights), np.zeros_like(layer.weights)
            layer.bias_momentums, layer.bias_cache = np.zeros_like(layer.biases), np.zeros_like(layer.biases)
        step = self.iterations + 1
        for values, grads, momentums, cache in (
            (layer.weights, layer.dweights, layer.weight_momentums, layer.weight_cache),
            (layer.biases, layer.dbiases, layer.bias_momentums, layer.bias_cache),
        ):
            momentums[:] = self.beta_1 * momentums + (1 - self.beta_1) * grads
            cache[:] = self.beta_2 * cache + (1 - self.beta_2) * grads ** 2
            corrected_momentums = momentums / (1 - self.beta_1 ** step)
            corrected_cache = cache / (1 - self.beta_2 ** step)
            values -= self.learning_rate * corrected_momentums / (np.sqrt(corrected_cache) + self.epsilon)

    def post_update_params(self):
        self.iterations += 1


def run(l2=0.0, dropout_rate=0.0, epochs=1500, seed=0):
    rng = np.random.default_rng(seed)
    X, y = spiral(15, 3, rng)                         # only 45 training points
    X_test, y_test = spiral(150, 3, rng)              # 450 fresh ones

    dense1 = Layer_Dense(2, 64, rng, weight_regularizer_l2=l2)
    activation1 = Activation_ReLU()
    dropout1 = Layer_Dropout(dropout_rate, rng)
    dense2 = Layer_Dense(64, 3, rng)
    loss_activation = Activation_Softmax_Loss_CategoricalCrossentropy()
    optimizer = Optimizer_Adam()

    def forward(inputs, labels, training):
        dense1.forward(inputs)
        activation1.forward(dense1.output)
        dropout1.forward(activation1.output, training)
        dense2.forward(dropout1.output)
        loss = loss_activation.forward(dense2.output, labels)
        accuracy = np.mean(np.argmax(loss_activation.output, axis=1) == labels)
        return loss, accuracy

    for _ in range(epochs):
        forward(X, y, training=True)
        loss_activation.backward(y)
        dense2.backward(loss_activation.dinputs)
        dropout1.backward(dense2.dinputs)
        activation1.backward(dropout1.dinputs)
        dense1.backward(activation1.dinputs)
        optimizer.update_params(dense1)
        optimizer.update_params(dense2)
        optimizer.post_update_params()

    _, train_accuracy = forward(X, y, training=False)
    test_loss, test_accuracy = forward(X_test, y_test, training=False)
    return train_accuracy, test_accuracy, test_loss


for name, settings in {
    "no remedy":      {},
    "weight penalty": {"l2": 1e-3},
    "dropout 30%":    {"dropout_rate": 0.3},
}.items():
    train_accuracy, test_accuracy, test_loss = run(**settings)
    print(f"{name:15s} train {train_accuracy:.2f}  test {test_accuracy:.2f}  test loss {test_loss:.2f}")
