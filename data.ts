import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'NEO-SHANGHAI VERTEX',
    subtitle: 'High-Density Vertical Eco-System',
    description: 'An experimental skyscraper concept designed for the post-2050 climate. It integrates atmospheric water generation with vertical hydroponic farming, creating a self-sustaining ecosystem within the mega-structure.',
    coverImage: 'https://picsum.photos/id/122/800/800',
    galleryImages: [
      'https://picsum.photos/id/122/1200/800',
      'https://picsum.photos/id/142/1200/800',
      'https://picsum.photos/id/188/1200/800'
    ],
    tags: ['Vertical City', 'Sustainability', 'Parametric Design'],
    aiContext: 'The Neo-Shanghai Vertex is a 1.2km tall vertical city. Key features include the Aerogellic Facade for water harvesting and the internal Mycelium structural supports. It challenges traditional concrete paradigms.'
  },
  {
    id: 'p2',
    title: 'VOID MUSEUM',
    subtitle: 'Subterranean Art Repository',
    description: 'Located in the desert salt flats, this museum exists entirely underground. Light is funneled through massive crystalline structures on the surface, creating shifting time-based light sculptures in the galleries below.',
    coverImage: 'https://picsum.photos/id/216/800/800',
    galleryImages: [
      'https://picsum.photos/id/216/1200/800',
      'https://picsum.photos/id/221/1200/800',
      'https://picsum.photos/id/238/1200/800'
    ],
    tags: ['Subterranean', 'Light Studies', 'Brutalism'],
    aiContext: 'The Void Museum explores the concept of "Architecture of Absence". By subtracting volume from the earth rather than adding to it, we create a sanctuary for art that is protected from extreme surface temperatures.'
  },
  {
    id: 'p3',
    title: 'CYBER-AGORA',
    subtitle: 'Mixed Reality Public Space',
    description: 'A physical public square overlaid with persistent AR functionality. The architecture serves as a canvas for digital artists, allowing the space to be reprogrammed instantly for protests, concerts, or markets.',
    coverImage: 'https://picsum.photos/id/355/800/800',
    galleryImages: [
      'https://picsum.photos/id/355/1200/800',
      'https://picsum.photos/id/364/1200/800',
      'https://picsum.photos/id/395/1200/800'
    ],
    tags: ['Mixed Reality', 'Urban Design', 'Public Space'],
    aiContext: 'Cyber-Agora investigates the intersection of physical tectonics and digital overlays. The concrete forms are embedded with QR-mesh nodes, allowing for precise tracking of AR layers without GPS drift.'
  }
];