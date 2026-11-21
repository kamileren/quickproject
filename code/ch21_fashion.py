"""Chapter 21: the whole network, trained on a real dataset of clothing images.

Usage:
    python code/ch21_fashion.py <folder with the four Fashion-MNIST .gz files> [--export <folder>]

The dataset is at https://github.com/zalandoresearch/fashion-mnist (MIT licence).
With --export, the trained weights, a sample of test images and the training log are written
out. Those files are what the interactive figures in the chapter load.
"""
import gzip
import json
import os
import sys

import numpy as np

CLASSES = ["T-shirt/top", "Trouser", "Pullover", "Dress", "Coat", "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot"]


# --- Loading -----------------------------------------------------------------------------------------
def load(folder, kind):
    """Reads one half of the dataset: images as (count, 784) bytes, labels as (count,) integers."""
    with gzip.open(os.path.join(folder, f"{kind}-labels-idx1-ubyte.gz"), "rb") as f:
        labels = np.frombuffer(f.read(), dtype=np.uint8, offset=8)
    with gzip.open(os.path.join(folder, f"{kind}-images-idx3-ubyte.gz"), "rb") as f:
        images = np.frombuffer(f.read(), dtype=np.uint8, offset=16).reshape(len(labels), 784)
    return images, labels.astype(int)


def scale(images):
    """Pixels arrive as 0 to 255. The network trains best on values from -1 to 1."""
    return (images.astype(np.float32) - 127.5) / 127.5


# --- The pieces built in chapters 14 to 20 ------------------------------------------------------------
class Layer_Dense:
    def __init__(self, n_inputs, n_neurons, rng):
        self.weights = (np.sqrt(2 / n_inputs) * rng.standard_normal((n_inputs, n_neurons))).astype(np.float32)
        self.biases = np.zeros((1, n_neurons), dtype=np.float32)

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
        return float(np.mean(-np.log(np.clip(self.output[range(len(inputs)), y_true], 1e-7, 1))))

    def backward(self, y_true):
        samples = len(self.output)
        self.dinputs = self.output.copy()
        self.dinputs[range(samples), y_true] -= 1
        self.dinputs /= samples


class Optimizer_Adam:
    def __init__(self, learning_rate=0.001, decay=0.0, epsilon=1e-7, beta_1=0.9, beta_2=0.999):
        self.learning_rate, self.decay, self.epsilon = learning_rate, decay, epsilon
        self.beta_1, self.beta_2 = beta_1, beta_2
        self.iterations = 0

    def update(self, layers):
        rate = self.learning_rate / (1 + self.decay * self.iterations)
        step = self.iterations + 1
        for layer in layers:
            if not hasattr(layer, "cache"):
                layer.momentums = [np.zeros_like(layer.weights), np.zeros_like(layer.biases)]
                layer.cache = [np.zeros_like(layer.weights), np.zeros_like(layer.biases)]
            for i, (values, grads) in enumerate(((layer.weights, layer.dweights), (layer.biases, layer.dbiases))):
                layer.momentums[i] = self.beta_1 * layer.momentums[i] + (1 - self.beta_1) * grads
                layer.cache[i] = self.beta_2 * layer.cache[i] + (1 - self.beta_2) * grads ** 2
                momentum = layer.momentums[i] / (1 - self.beta_1 ** step)
                cache = layer.cache[i] / (1 - self.beta_2 ** step)
                values -= rate * momentum / (np.sqrt(cache) + self.epsilon)
        self.iterations += 1


# --- The model: every piece wired together -----------------------------------------------------------
class Model:
    """784 pixels -> 64 ReLU neurons -> 64 ReLU neurons -> 10 class scores."""

    def __init__(self, rng):
        self.dense = [Layer_Dense(784, 64, rng), Layer_Dense(64, 64, rng), Layer_Dense(64, 10, rng)]
        self.relu = [Activation_ReLU(), Activation_ReLU()]
        self.loss = Activation_Softmax_Loss_CategoricalCrossentropy()

    def forward(self, X, y):
        self.dense[0].forward(X)
        self.relu[0].forward(self.dense[0].output)
        self.dense[1].forward(self.relu[0].output)
        self.relu[1].forward(self.dense[1].output)
        self.dense[2].forward(self.relu[1].output)
        return self.loss.forward(self.dense[2].output, y)

    def backward(self, y):
        self.loss.backward(y)
        self.dense[2].backward(self.loss.dinputs)
        self.relu[1].backward(self.dense[2].dinputs)
        self.dense[1].backward(self.relu[1].dinputs)
        self.relu[0].backward(self.dense[1].dinputs)
        self.dense[0].backward(self.relu[0].dinputs)

    def predict(self, X):
        """Inference: a forward pass with no labels, returning the most likely class of each image."""
        self.forward(X, np.zeros(len(X), dtype=int))
        return np.argmax(self.loss.output, axis=1)

    def evaluate(self, X, y, batch_size=1000):
        correct = sum(int(np.sum(self.predict(X[i:i + batch_size]) == y[i:i + batch_size])) for i in range(0, len(X), batch_size))
        return correct / len(X)

    # Saving a model means saving its numbers. Nothing else about it needs to be stored.
    def get_parameters(self):
        return [(layer.weights, layer.biases) for layer in self.dense]

    def set_parameters(self, parameters):
        for layer, (weights, biases) in zip(self.dense, parameters):
            layer.weights, layer.biases = weights, biases


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = sys.argv[1]
    export = sys.argv[sys.argv.index("--export") + 1] if "--export" in sys.argv else None

    train_images, y_train = load(folder, "train")
    test_images, y_test = load(folder, "t10k")
    X_train, X_test = scale(train_images), scale(test_images)
    print(f"{len(X_train)} training images, {len(X_test)} test images, {X_train.shape[1]} pixels each")

    rng = np.random.default_rng(0)
    model = Model(rng)
    optimizer = Optimizer_Adam(learning_rate=0.001, decay=1e-4)
    print(f"untrained: test accuracy {model.evaluate(X_test, y_test):.3f}")

    epochs, batch_size = 5, 128
    steps_per_epoch = int(np.ceil(len(X_train) / batch_size))
    log = {"batchSize": batch_size, "stepsPerEpoch": steps_per_epoch, "loss": [], "epochs": []}
    step = 0
    for epoch in range(1, epochs + 1):
        order = rng.permutation(len(X_train))          # a fresh shuffle every epoch
        running = []
        for start in range(0, len(order), batch_size):
            batch = order[start:start + batch_size]
            loss = model.forward(X_train[batch], y_train[batch])
            model.backward(y_train[batch])
            optimizer.update(model.dense)
            running.append(loss)
            step += 1
            if step % 10 == 0:
                log["loss"].append([step, round(loss, 4)])
        train_accuracy = model.evaluate(X_train, y_train)
        test_accuracy = model.evaluate(X_test, y_test)
        log["epochs"].append({"epoch": epoch, "step": step, "meanLoss": round(float(np.mean(running)), 4),
                              "trainAccuracy": round(train_accuracy, 4), "testAccuracy": round(test_accuracy, 4)})
        print(f"epoch {epoch}: mean loss {np.mean(running):.3f}  train accuracy {train_accuracy:.3f}  test accuracy {test_accuracy:.3f}")

    # Save and reload, to show that the parameters are all there is to a model.
    saved = [(w.copy(), b.copy()) for w, b in model.get_parameters()]
    fresh = Model(np.random.default_rng(123))
    print(f"a new model before loading: {fresh.evaluate(X_test, y_test):.3f}")
    fresh.set_parameters(saved)
    print(f"the same model after loading: {fresh.evaluate(X_test, y_test):.3f}")

    if export:
        os.makedirs(export, exist_ok=True)
        # Weights: every layer's weights then biases, as 32-bit floats.
        with open(os.path.join(export, "model.bin"), "wb") as f:
            for weights, biases in saved:
                f.write(weights.astype("<f4").tobytes())
                f.write(biases.astype("<f4").tobytes())
        # A balanced sample of test images the model has never trained on: 50 of each class.
        picks = np.concatenate([np.where(y_test == label)[0][:50] for label in range(10)])
        picks = picks[np.random.default_rng(1).permutation(len(picks))]
        with open(os.path.join(export, "test.bin"), "wb") as f:
            f.write(test_images[picks].tobytes())
            f.write(y_test[picks].astype(np.uint8).tobytes())
        log.update({"classes": CLASSES, "layers": [784, 64, 64, 10], "sampleCount": int(len(picks)),
                    "sampleAccuracy": round(fresh.evaluate(X_test[picks], y_test[picks]), 4),
                    "parameters": int(sum(w.size + b.size for w, b in saved))})
        with open(os.path.join(export, "log.json"), "w") as f:
            json.dump(log, f, separators=(",", ":"))
        print(f"exported {log['parameters']} parameters and {len(picks)} test images to {export}")


if __name__ == "__main__":
    main()
