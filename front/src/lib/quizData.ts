export interface QuizQuestion {
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizMeta {
  id: string;
  title: string;
  createdLabel: string;
  status: "Published" | "Draft";
}

export const quizList: QuizMeta[] = [
  {
    id: "cell-biology-organelles",
    title: "Cell Biology: Organelles and Energy",
    createdLabel: "Created October 28, 2026",
    status: "Published",
  },
  {
    id: "intro-to-genetics",
    title: "Introduction to Genetics",
    createdLabel: "Created October 24, 2026",
    status: "Published",
  },
  {
    id: "ecosystems-energy-flow",
    title: "Ecosystems and Energy Flow",
    createdLabel: "Created October 20, 2026",
    status: "Published",
  },
];

const cellBiologyQuestions: QuizQuestion[] = [
  {
    category: "Cell Biology: Organelles and Energy",
    question: "What is the primary function of the cell membrane?",
    options: [
      "To store genetic information",
      "To control what enters and exits the cell",
      "To produce ATP for the cell",
      "To synthesize proteins",
    ],
    correctIndex: 1,
    explanation:
      "The cell membrane is a selectively permeable barrier that regulates the movement of substances into and out of the cell.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "Which structure is known as the 'control center' of the cell?",
    options: ["Nucleus", "Vacuole", "Lysosome", "Cytoplasm"],
    correctIndex: 0,
    explanation:
      "The nucleus contains the cell's DNA and coordinates activities like growth, metabolism, and reproduction.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question:
      "Which organelle produces most ATP during aerobic respiration in eukaryotic cells?",
    options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi apparatus"],
    correctIndex: 2,
    explanation:
      "Mitochondria produce most ATP through oxidative phosphorylation during aerobic respiration. Ribosomes synthesize proteins, while the nucleus stores DNA and the Golgi apparatus modifies and sorts proteins.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "What is the main role of ribosomes in a cell?",
    options: [
      "Breaking down waste products",
      "Storing water and nutrients",
      "Synthesizing proteins",
      "Generating energy through photosynthesis",
    ],
    correctIndex: 2,
    explanation:
      "Ribosomes read messenger RNA and assemble amino acids into proteins, making them the cell's protein factories.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "Which organelle modifies, sorts, and packages proteins for transport?",
    options: ["Golgi apparatus", "Peroxisome", "Cytoskeleton", "Mitochondrion"],
    correctIndex: 0,
    explanation:
      "The Golgi apparatus receives proteins from the endoplasmic reticulum, modifies them, and packages them for delivery.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "What distinguishes a plant cell from an animal cell?",
    options: [
      "Presence of a nucleus",
      "Presence of mitochondria",
      "Presence of a cell wall and chloroplasts",
      "Presence of ribosomes",
    ],
    correctIndex: 2,
    explanation:
      "Plant cells have a rigid cell wall for structural support and chloroplasts for photosynthesis, both absent in animal cells.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "Which process do chloroplasts carry out?",
    options: ["Cellular respiration", "Photosynthesis", "Protein folding", "DNA replication"],
    correctIndex: 1,
    explanation:
      "Chloroplasts convert light energy into chemical energy (glucose) through the process of photosynthesis.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "What is the function of lysosomes?",
    options: [
      "Digesting waste materials and cellular debris",
      "Producing hormones",
      "Storing genetic material",
      "Building the cytoskeleton",
    ],
    correctIndex: 0,
    explanation:
      "Lysosomes contain digestive enzymes that break down waste products, old organelles, and foreign material.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "Which structure provides shape and support while enabling cell movement?",
    options: ["Cytoskeleton", "Nucleolus", "Golgi apparatus", "Smooth ER"],
    correctIndex: 0,
    explanation:
      "The cytoskeleton is a network of protein filaments that maintains cell shape and supports movement and division.",
  },
  {
    category: "Cell Biology: Organelles and Energy",
    question: "What is the role of the endoplasmic reticulum (rough ER)?",
    options: [
      "Storing energy as fat",
      "Transporting proteins synthesized by attached ribosomes",
      "Breaking down lipids",
      "Producing ATP",
    ],
    correctIndex: 1,
    explanation:
      "The rough ER is studded with ribosomes and is responsible for processing and transporting proteins made during translation.",
  },
];

const geneticsQuestions: QuizQuestion[] = [
  {
    category: "Introduction to Genetics",
    question: "What is a gene?",
    options: [
      "A segment of DNA that codes for a protein or trait",
      "A type of cell organelle",
      "A unit of energy in the cell",
      "A protein that digests nutrients",
    ],
    correctIndex: 0,
    explanation: "A gene is a specific sequence of DNA that carries the instructions for a particular trait or protein.",
  },
  {
    category: "Introduction to Genetics",
    question: "What do we call the different forms of a gene?",
    options: ["Alleles", "Genomes", "Chromatids", "Phenotypes"],
    correctIndex: 0,
    explanation: "Alleles are alternative versions of a gene that can produce variation in inherited traits.",
  },
  {
    category: "Introduction to Genetics",
    question: "Which molecule carries genetic information in most organisms?",
    options: ["RNA", "DNA", "ATP", "Glucose"],
    correctIndex: 1,
    explanation: "DNA (deoxyribonucleic acid) stores and transmits genetic information across generations.",
  },
];

const ecosystemsQuestions: QuizQuestion[] = [
  {
    category: "Ecosystems and Energy Flow",
    question: "What are organisms that produce their own food called?",
    options: ["Consumers", "Decomposers", "Producers", "Predators"],
    correctIndex: 2,
    explanation: "Producers, such as plants, create their own energy through photosynthesis.",
  },
  {
    category: "Ecosystems and Energy Flow",
    question: "How does energy generally move through an ecosystem?",
    options: [
      "From decomposers to producers",
      "From producers to consumers to decomposers",
      "Equally among all organisms at once",
      "It does not move between organisms",
    ],
    correctIndex: 1,
    explanation:
      "Energy flows from producers to primary consumers, then to higher-level consumers, and finally to decomposers.",
  },
  {
    category: "Ecosystems and Energy Flow",
    question: "What role do decomposers play in an ecosystem?",
    options: [
      "They break down dead organisms and recycle nutrients",
      "They produce oxygen for the atmosphere",
      "They hunt live prey exclusively",
      "They convert sunlight into chemical energy",
    ],
    correctIndex: 0,
    explanation: "Decomposers break down dead organic matter, returning nutrients to the soil and ecosystem.",
  },
];

export const quizQuestionBank: Record<string, QuizQuestion[]> = {
  "cell-biology-organelles": cellBiologyQuestions,
  "intro-to-genetics": geneticsQuestions,
  "ecosystems-energy-flow": ecosystemsQuestions,
};
