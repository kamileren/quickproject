"""Chapter 18: optimizers. Learning-rate decay, momentum, AdaGrad, RMSProp and Adam."""
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


class Optimizer:
    """Shared by every optimizer: the learning rate shrinks as rate / (1 + decay * step)."""

    def __init__(self, learning_rate, decay=0.0):
        self.learning_rate = learning_rate
        self.current_learning_rate = learning_rate
        self.decay = decay
        self.iterations = 0

    def pre_update_params(self):
        self.current_learning_rate = self.learning_rate / (1.0 + self.decay * self.iterations)

    def post_update_params(self):
        self.iterations += 1


class Optimizer_SGD(Optimizer):
    """Gradient descent, optionally with momentum: part of the last step is carried into the next."""

    def __init__(self, learning_rate=1.0, decay=0.0, momentum=0.0):
        super().__init__(learning_rate, decay)
        self.momentum = momentum

    def update_params(self, layer):
        if not hasattr(layer, "weight_momentums"):
            layer.weight_momentums = np.zeros_like(layer.weights)
            layer.bias_momentums = np.zeros_like(layer.biases)
        layer.weight_momentums = self.momentum * layer.weight_momentums - self.current_learning_rate * layer.dweights
        layer.bias_momentums = self.momentum * layer.bias_momentums - self.current_learning_rate * layer.dbiases
        layer.weights += layer.weight_momentums
        layer.biases += layer.bias_momentums


class Optimizer_Adagrad(Optimizer):
    """Each weight's step shrinks according to how much it has moved in total."""

    def __init__(self, learning_rate=1.0, decay=0.0, epsilon=1e-7):
        super().__init__(learning_rate, decay)
        self.epsilon = epsilon

    def update_params(self, layer):
        if not hasattr(layer, "weight_cache"):
            layer.weight_cache = np.zeros_like(layer.weights)
            layer.bias_cache = np.zeros_like(layer.biases)
        layer.weight_cache += layer.dweights ** 2
        layer.bias_cache += layer.dbiases ** 2
        layer.weights -= self.current_learning_rate * layer.dweights / (np.sqrt(layer.weight_cache) + self.epsilon)
        layer.biases -= self.current_learning_rate * layer.dbiases / (np.sqrt(layer.bias_cache) + self.epsilon)


class Optimizer_RMSprop(Optimizer):
    """Like AdaGrad, but the history fades, so steps do not shrink for ever."""

    def __init__(self, learning_rate=0.001, decay=0.0, epsilon=1e-7, rho=0.9):
        super().__init__(learning_rate, decay)
        self.epsilon = epsilon
        self.rho = rho

    def update_params(self, layer):
        if not hasattr(layer, "weight_cache"):
            layer.weight_cache = np.zeros_like(layer.weights)
            layer.bias_cache = np.zeros_like(layer.biases)
        layer.weight_cache = self.rho * layer.weight_cache + (1 - self.rho) * layer.dweights ** 2
        layer.bias_cache = self.rho * layer.bias_cache + (1 - self.rho) * layer.dbiases ** 2
        layer.weights -= self.current_learning_rate * layer.dweights / (np.sqrt(layer.weight_cache) + self.epsilon)
        layer.biases -= self.current_learning_rate * layer.dbiases / (np.sqrt(layer.bias_cache) + self.epsilon)


class Optimizer_Adam(Optimizer):
    """Momentum and RMSProp together, with a correction for the first few steps."""

    def __init__(self, learning_rate=0.001, decay=0.0, epsilon=1e-7, beta_1=0.9, beta_2=0.999):
        super().__init__(learning_rate, decay)
        self.epsilon = epsilon
        self.beta_1 = beta_1
        self.beta_2 = beta_2

    def update_params(self, layer):
        if not hasattr(layer, "weight_cache"):
            layer.weight_momentums = np.zeros_like(layer.weights)
            layer.weight_cache = np.zeros_like(layer.weights)
            layer.bias_momentums = np.zeros_like(layer.biases)
            layer.bias_cache = np.zeros_like(layer.biases)
        # Momentum: a running average of the gradients.
        layer.weight_momentums = self.beta_1 * layer.weight_momentums + (1 - self.beta_1) * layer.dweights
        layer.bias_momentums = self.beta_1 * layer.bias_momentums + (1 - self.beta_1) * layer.dbiases
        # Cache: a running average of the squared gradients.
        layer.weight_cache = self.beta_2 * layer.weight_cache + (1 - self.beta_2) * layer.dweights ** 2
        layer.bias_cache = self.beta_2 * layer.bias_cache + (1 - self.beta_2) * layer.dbiases ** 2
        # Both averages start at zero, so early on they are too small. Dividing corrects that.
        step = self.iterations + 1
        weight_momentums = layer.weight_momentums / (1 - self.beta_1 ** step)
        bias_momentums = layer.bias_momentums / (1 - self.beta_1 ** step)
        weight_cache = layer.weight_cache / (1 - self.beta_2 ** step)
        bias_cache = layer.bias_cache / (1 - self.beta_2 ** step)

        layer.weights -= self.current_learning_rate * weight_momentums / (np.sqrt(weight_cache) + self.epsilon)
        layer.biases -= self.current_learning_rate * bias_momentums / (np.sqrt(bias_cache) + self.epsilon)


def train(optimizer, epochs=2000, seed=0):
    rng = np.random.default_rng(seed)
    X, y = spiral(100, 3, rng)
    dense1, activation1, dense2 = Layer_Dense(2, 64, rng), Activation_ReLU(), Layer_Dense(64, 3, rng)
    loss_activation = Activation_Softmax_Loss_CategoricalCrossentropy()
    for _ in range(epochs):
        dense1.forward(X)
        activation1.forward(dense1.output)
        dense2.forward(activation1.output)
        loss = loss_activation.forward(dense2.output, y)

        loss_activation.backward(y)
        dense2.backward(loss_activation.dinputs)
        activation1.backward(dense2.dinputs)
        dense1.backward(activation1.dinputs)

        optimizer.pre_update_params()
        optimizer.update_params(dense1)
        optimizer.update_params(dense2)
        optimizer.post_update_params()
    accuracy = np.mean(np.argmax(loss_activation.output, axis=1) == y)
    return loss, accuracy


runs = {
    "SGD":      Optimizer_SGD(learning_rate=1.0),
    "Momentum": Optimizer_SGD(learning_rate=1.0, decay=1e-3, momentum=0.9),
    "AdaGrad":  Optimizer_Adagrad(learning_rate=1.0, decay=1e-4),
    "RMSProp":  Optimizer_RMSprop(learning_rate=0.02, decay=1e-5),
    "Adam":     Optimizer_Adam(learning_rate=0.05, decay=5e-7),
}
for name, optimizer in runs.items():
    loss, accuracy = train(optimizer)
    print(f"{name:9s} loss {loss:.3f}  accuracy {accuracy:.2f}")
