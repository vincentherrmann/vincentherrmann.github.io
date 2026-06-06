---
type: pages
layout: single
author_profile: true
permalink: /
classes: content-small
---

I am a PhD candidate at the Swiss AI Lab IDSIA, University of Lugano, where I work under the supervision of Prof. Jürgen Schmidhuber. 
My research centers on artificial curiosity, representation learning, reinforcement learning, and information theory, with the aim of uncovering criteria for determining the 'interestingness' of objects and developing effective representations for them. 
In addition to my academic pursuits, I am a classical pianist and composer.

## Interestingness, Open-Ended Learning, and Artificial Curiosity

I believe that the challenge of interestingness is central to building open-ended, creative, and self-improving systems. I aim to understand what makes something interesting—both in theory, using tools from algorithmic information theory and Kolmogorov complexity, and in practice, by leveraging the in-context learning capabilities of LLMs.

- **Interestingness as an Inductive Heuristic for Future Compression Progress:** We provide a formal definition of interestingness, prove some intriguing properties, experimentally investigate it using exhaustive program search in various Turing-complete domains, and connect it to current machine learning approaches. Most importantly, we show that the metric predicting potential future compression progress best is "stagnation length": the gap since the last observed progress. The longer progress has stalled, the less likely future progress becomes.
    
- **Measuring In-Context Computation Complexity via Hidden State Prediction:** How can we determine whether an LLM is doing anything "interesting" at any given moment? Traditional loss only tells us if the next token can be accurately predicted. It says nothing about the computational effort required to predict it. We connect task complexity to the in-context program that the model must synthesize dynamically to solve a task, demonstrating that this can be estimated by measuring the predictability of future hidden states in a sequence model.
    
- **Multiple Token Divergence:** We utilize the multi-token prediction heads that many modern LLMs are trained with to measure exactly when additional computational effort alters outputs versus when a shallow shortcut module suffices. In contrast to hidden state prediction, Multiple Token Divergence operates directly at the logit level. This enables real-time model steering during generation: by extrapolating away from the shortcut distribution, we can encourage counter-intuitive tokens that only make sense with deeper computation, enhancing creative capabilities.
    
- **Learning One Abstract Bit at a Time:** Agents that explore the world in an open-ended way and act as artificial scientists must learn how to formulate insightful questions. We present a novel framework for this: most scientific problems can be framed as binary questions of the form, _"If I perform this exact experiment, will I get this exact outcome?"_ Due to the computational universality of RNNs, any such question can be encoded within their weights. We implement a proof of concept where a controller module continuously generates such questions and verifies the answers within the environment, receiving rewards for questions that yield high information gain.
    

## Understanding and Generating Neural Networks at the Weights Level

The weights of a neural network are its program. They can also be treated as data. We can train models to generate, interpret, or modify these weights. While neural network weights offer a universal representational format, they present significant challenges: they are massively high-dimensional and rich with complex symmetries that we must learn to exploit.

- **Learning Useful Representations of Recurrent Neural Network Weight Matrices:** RNNs are Turing complete, meaning their weights can theoretically represent any computable function. We investigate different ways of how a weight-encoder can extract various aspects about what exactly an RNN does, given only its weights. We find that our novel "interactive probing" method drastically outperforms mechanistic approaches: instead of looking directly at the weights, our functionalist approach successfully learns to interrogate the behavior of the network they define.
    
- **Goal-Conditioned Generators of Deep Policies:** Using probing techniques, we can evaluate the exact degree to which a policy achieves a specified goal in an environment. In this work, we take this a step further by generating policy weights conditioned directly on a target goal. By backpropagating through the policy evaluator, we can train this weight generator efficiently. This forms the basis of a novel RL algorithm: by iteratively requesting policies that perform marginally better than those already generated, we directionally explore the parameter space to obtain high-performing policies.
    
- **Sonifying and Visualizing How Music Sounds to an Artificial Ear:** This project is an audio-visual study of the inner workings of sound-processing neural networks. How do internal activations react to different acoustic properties? To which kinds of sounds does a given layer or individual neuron respond? We present a real-time tool that answers these questions, allowing users to select specific neurons and synthesize the exact audio that triggers them via gradient descent.
    

## Creativity, Music, and Narratives

I am deeply interested in the creative process—specifically, what defines a work of art, which aspects of the process can be automated, and which remain inherently human. These projects sit at the intersection of science, engineering, and art, exploring how far we can push the boundaries of computational creativity.

- **Narrative Arcs:** Many works of art aim to tell a story. We introduce the concept of "narrative information": the aspect of a narrative "atom" in a story that best predicts its structural placement within the whole. We propose a concrete method to distill an atom down to a low-dimensional "narrative essence." Using music albums as a case study, we identify prototypical narrative arcs and introduce an algorithm to automatically rearrange an arbitrary set of tracks to conform to a specific narrative trajectory.
    
- **Automatic Album Sequencing:** When listening to music playlists, users are typically limited two options: the pre-defined order, or a randomly shuffled one. We present a tool that automatically sequences an arbitrary collection of tracks into multiple coherent orders. The underlying model was trained on many thousands of music albums, successfully extracting the latent structural patterns human producers use when arranging tracks.
    
- **Generation of Symbolic Music:** In this work, we investigate several core challenges of symbolic, MIDI-like music generation. We propose a novel command-based tokenization scheme, augmentations for input representations, and targeted modifications to the relative attention mechanism. Additionally, we present a discrete representation-learning architecture that yields downsampled sequences, which can be easily generated by a dedicated model and subsequently upsampled using a learned decoder.