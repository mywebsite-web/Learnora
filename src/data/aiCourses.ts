export interface LessonItem {
  id: string;
  orderNumber: string; // '01', '02', etc.
  title: string;
  duration: string; // e.g., '3:20 min'
  type: 'video' | 'audio' | 'interactive';
  summary: string;
  keyPoints: string[];
  audioScript: string;
  completed?: boolean;
}

export interface AiCourse {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  iconType: 'brain' | 'language' | 'vision' | 'prompt' | 'code';
  color: string;
  bgTint: string;
  completionPercent: number;
  currentLesson: number;
  totalLessons: number;
  rating: number;
  studentCount: number;
  description: string;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  curriculum: LessonItem[];
}

export const AI_COURSES: AiCourse[] = [
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    subtitle: 'Master ChatGPT & Midjourney',
    category: 'Generative AI',
    iconType: 'prompt',
    color: 'from-blue-600 to-indigo-600',
    bgTint: 'bg-blue-50 text-blue-600',
    completionPercent: 65,
    currentLesson: 4,
    totalLessons: 6,
    rating: 4.9,
    studentCount: 1420,
    description: 'Learn how to construct high-leverage prompts that unlock complex reasoning, structured code generation, and photorealistic creative imagery across cutting-edge LLMs.',
    instructor: {
      name: 'Dr. Sarah Chen',
      role: 'Principal AI Researcher & Stanford Fellow',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    curriculum: [
      {
        id: 'pe-01',
        orderNumber: '01',
        title: 'Prompt Engineering?',
        duration: '3:20 min',
        type: 'audio',
        summary: 'Understanding the fundamentals of latent space steering and the anatomy of token prediction in modern generative models.',
        keyPoints: [
          'LLMs predict next-token probabilities conditioned on context.',
          'Prompt clarity directly bounds the quality of the latent representation.',
          'Avoiding negative constraints in favor of affirmative instructions.'
        ],
        audioScript: "Welcome to Prompt Engineering. In this opening lesson, we explore how modern foundation models interpret your words. A prompt is not a search query; it is a coordinate in high-dimensional latent space that steers generation towards precise conceptual destinations.",
        completed: true
      },
      {
        id: 'pe-02',
        orderNumber: '02',
        title: 'Anatomy of an Effective Prompt',
        duration: '5:10 min',
        type: 'video',
        summary: 'Mastering the 5 core components: Persona, Context, Task, Constraints, and Output Format specification.',
        keyPoints: [
          'Persona definition sets vocabulary and depth of reasoning.',
          'Delimiters (XML tags or triple backticks) prevent prompt injection.',
          'Specifying JSON or Markdown output eliminates parsing friction.'
        ],
        audioScript: "An effective prompt consists of five distinct anchors: Persona, Context, Core Task, Operational Constraints, and Output Format. When you provide structured delimiters, the attention heads can isolate input data from instructions flawlessly.",
        completed: true
      },
      {
        id: 'pe-03',
        orderNumber: '03',
        title: 'Few-shot & Zero-shot Learning',
        duration: '8:45 min',
        type: 'interactive',
        summary: 'How to use in-context exemplars to dramatically reduce hallucination rates and enforce strict formatting.',
        keyPoints: [
          'Zero-shot relies solely on parametric pre-training weights.',
          'Few-shot anchors output patterns via 2-3 input/output pairs.',
          'Counter-exemplars help suppress common failure modes.'
        ],
        audioScript: "Few-shot prompting provides concrete exemplars directly inside the context window. By showing the model exactly how input A transforms into output B, we guide in-context attention without needing fine-tuning.",
        completed: false
      },
      {
        id: 'pe-04',
        orderNumber: '04',
        title: 'Chain-of-Thought & Reasoning Hooks',
        duration: '6:15 min',
        type: 'audio',
        summary: 'Eliciting step-by-step cognitive traces to solve multi-step mathematical, algorithmic, and analytical problems.',
        keyPoints: [
          'Let us think step by step triggers intermediate computation tokens.',
          'Self-consistency voting samples multiple reasoning paths.',
          'Tree of Thoughts for non-linear strategic decision making.'
        ],
        audioScript: "Chain-of-thought prompting allows the transformer architecture to generate intermediate computational steps before committing to a final answer, effectively expanding the compute budget per answer.",
        completed: false
      },
      {
        id: 'pe-05',
        orderNumber: '05',
        title: 'Midjourney & Image Generation Prompts',
        duration: '7:30 min',
        type: 'video',
        summary: 'Artistic camera directions, aspect ratios, lighting descriptors, and stylized weights for diffusion models.',
        keyPoints: [
          'Lighting keywords: volumetric raytracing, golden hour, chiaroscuro.',
          'Camera lenses: 85mm f/1.4, macro anamorphic, tilt-shift.',
          'Stylize and chaos parameters control visual divergence.'
        ],
        audioScript: "Diffusion models interpret visual prompts through spatial cross-attention. Learn how photographic descriptors like f-stop, focal length, and color grading transform abstract concepts into breathtaking imagery.",
        completed: false
      },
      {
        id: 'pe-06',
        orderNumber: '06',
        title: 'Hands-on AI Lab & Capstone Test',
        duration: '10:00 min',
        type: 'interactive',
        summary: 'Interactive coding lab: build an automated evaluator prompt and test it against edge-case benchmarks.',
        keyPoints: [
          'System prompt hardening against adversarial inputs.',
          'Automated benchmark testing with synthetic evaluation datasets.',
          'Final certification capstone project.'
        ],
        audioScript: "In this capstone lab, you will engineer a production-ready system prompt, test it against edge cases, and run benchmark evaluations.",
        completed: false
      }
    ]
  },
  {
    id: 'deep-learning',
    title: 'Deep Learning',
    subtitle: 'Fundamentals',
    category: 'Neural Networks',
    iconType: 'brain',
    color: 'from-blue-600 to-cyan-600',
    bgTint: 'bg-blue-50 text-blue-600',
    completionPercent: 45,
    currentLesson: 3,
    totalLessons: 8,
    rating: 4.8,
    studentCount: 2190,
    description: 'Deconstruct neural network architectures from backpropagation and gradient descent to transformers and residual connections.',
    instructor: {
      name: 'Marcus Vance',
      role: 'Deep Learning Engineer & Researcher',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    curriculum: [
      {
        id: 'dl-01',
        orderNumber: '01',
        title: 'Perceptrons & Activation Functions',
        duration: '4:15 min',
        type: 'video',
        summary: 'Single-layer perceptrons, non-linearity, ReLU, GELU, and Sigmoid.',
        keyPoints: ['Non-linear activations allow networks to approximate arbitrary functions.', 'Vanishing gradients and the advent of ReLU.'],
        audioScript: "Welcome to Deep Learning Fundamentals. We begin with the mathematical foundation of artificial neurons and non-linear activations.",
        completed: true
      },
      {
        id: 'dl-02',
        orderNumber: '02',
        title: 'Backpropagation & Loss Landscapes',
        duration: '6:50 min',
        type: 'audio',
        summary: 'The chain rule in matrix calculus, Adam optimizer, and learning rate scheduling.',
        keyPoints: ['Automatic differentiation traverses the computational graph backwards.', 'Stochastic gradient descent with momentum.'],
        audioScript: "Backpropagation uses the calculus chain rule to calculate the partial derivatives of the loss function with respect to every weight.",
        completed: true
      },
      {
        id: 'dl-03',
        orderNumber: '03',
        title: 'Convolutional Neural Networks',
        duration: '5:40 min',
        type: 'interactive',
        summary: 'Spatial kernels, feature maps, pooling layers, and ResNet skip connections.',
        keyPoints: ['Spatial equivariance and parameter sharing in image processing.', 'Residual shortcuts solve degradation in deep architectures.'],
        audioScript: "CNNs revolutionized computer vision by using localized sliding filters that preserve 2D spatial relationships.",
        completed: false
      }
    ]
  },
  {
    id: 'natural-language',
    title: 'Natural Language',
    subtitle: 'Advanced Techniques',
    category: 'NLP & Transformers',
    iconType: 'language',
    color: 'from-indigo-600 to-blue-700',
    bgTint: 'bg-indigo-50 text-indigo-600',
    completionPercent: 70,
    currentLesson: 6,
    totalLessons: 10,
    rating: 4.9,
    studentCount: 3120,
    description: 'Explore self-attention mechanisms, causal language modeling, RLHF, and retrieval-augmented generation (RAG).',
    instructor: {
      name: 'Elena Rostova',
      role: 'Staff NLP Architect',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    curriculum: [
      {
        id: 'nlp-01',
        orderNumber: '01',
        title: 'Tokenization & Byte-Pair Encoding',
        duration: '3:45 min',
        type: 'video',
        summary: 'Subword tokenization, vocabulary compression, and handling out-of-vocabulary terms.',
        keyPoints: ['BPE balances character-level flexibility with word-level semantic density.', 'Token count directly affects context window limits.'],
        audioScript: "Before any text enters a transformer, it must be tokenized into subword indices using algorithms like Byte-Pair Encoding.",
        completed: true
      },
      {
        id: 'nlp-02',
        orderNumber: '02',
        title: 'Scaled Dot-Product Attention',
        duration: '7:20 min',
        type: 'audio',
        summary: 'Queries, Keys, and Values: how self-attention captures contextual relationships across arbitrary distances.',
        keyPoints: ['Softmax(QK^T / sqrt(d_k)) * V formula.', 'Multi-head attention captures diverse relational subspaces.'],
        audioScript: "Self-attention replaces recurrence with parallel matrix multiplications, computing the mutual relevance of every token pair in the sequence.",
        completed: true
      }
    ]
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision',
    subtitle: 'Image Recognition',
    category: 'Vision AI',
    iconType: 'vision',
    color: 'from-sky-500 to-blue-600',
    bgTint: 'bg-sky-50 text-sky-600',
    completionPercent: 25,
    currentLesson: 2,
    totalLessons: 8,
    rating: 4.7,
    studentCount: 980,
    description: 'Object detection, semantic segmentation, Vision Transformers (ViT), and multimodal image-text embeddings with CLIP.',
    instructor: {
      name: 'Alex Morgan',
      role: 'Computer Vision Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    curriculum: [
      {
        id: 'cv-01',
        orderNumber: '01',
        title: 'Image Processing & Filters',
        duration: '4:30 min',
        type: 'video',
        summary: 'Sobel filters, edge detection, color space transformations, and affine warping.',
        keyPoints: ['Digital images as 3D matrices of RGB tensor values.', 'Kernel convolution highlights gradients and visual edges.'],
        audioScript: "In Computer Vision, images are treated as numerical matrices. We apply mathematical convolution kernels to detect edges, corners, and textures.",
        completed: true
      },
      {
        id: 'cv-02',
        orderNumber: '02',
        title: 'Vision Transformers (ViT)',
        duration: '8:10 min',
        type: 'interactive',
        summary: 'Treating 16x16 image patches as sequences of tokens processed by standard transformer encoders.',
        keyPoints: ['Patch extraction and linear projection to embedding dimension.', 'Global receptive field from the very first layer.'],
        audioScript: "Vision Transformers demonstrated that self-attention can outperform convolutional networks on large-scale visual benchmarks without spatial inductive biases.",
        completed: false
      }
    ]
  }
];
