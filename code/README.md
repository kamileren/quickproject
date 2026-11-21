# Companion code for Part IV: a neural network from scratch

One short NumPy file per chapter. Each file runs on its own and prints the numbers quoted in its
chapter, so you can check the text against the code.

| File | Chapter | What it adds |
|---|---|---|
| `ch14_neuron.py` | 14. A Single Neuron | A neuron, a layer of neurons, a batch of examples |
| `ch15_activations.py` | 15. Layers and Activations | The ReLU activation, and a two-layer forward pass |
| `ch16_loss.py` | 16. Scoring a Classifier | Softmax and the cross-entropy loss |
| `ch17_backprop.py` | 17. Backpropagation | Backward methods, an SGD optimizer, and a full training loop on spiral data |
| `ch18_optimizers.py` | 18. Optimizers | Learning-rate decay, momentum, AdaGrad, RMSProp and Adam, compared on the spiral |
| `ch19_regularization.py` | 19. Keeping Networks Honest | A weight penalty in the dense layer, and a dropout layer |

Run any of them with Python 3 and NumPy installed:

```
python code/ch14_neuron.py
```

The structure of the code (a class per layer, with `forward` and later `backward` methods) follows
*Neural Networks from Scratch in Python* by Harrison Kinsley and Daniel Kukieła, whose code is MIT
licensed. See `LICENSE-NNFS`. The explanations in the book chapters are original.
