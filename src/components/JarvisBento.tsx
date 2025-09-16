import React, { useRef } from 'react';
import { Box, VStack, Heading, Text, Button } from '@chakra-ui/react';

// Données personnalisées pour JARVIS
const jarvisCardData = [
  {
    color: '#060010',
    title: 'JARVIS Fitness',
    description: 'Assistant IA conversationnel pour salles de sport. Engagement membre 24/7 avec reconnaissance vocale avancée.',
    label: 'Disponible',
    icon: '🏋️‍♂️',
    status: 'active',
    buttonText: 'Découvrir',
    buttonAction: () => console.log('JARVIS Fitness clicked')
  },
  {
    color: '#060010',
    title: 'JARVIS Museums',
    description: 'Guide IA interactif pour espaces culturels. Expérience visiteur personnalisée et immersive.',
    label: 'Bientôt',
    icon: '🏛️',
    status: 'coming-soon',
    buttonText: 'Bientôt disponible',
    buttonAction: () => console.log('JARVIS Museums clicked')
  },
  {
    color: '#060010',
    title: 'Analytics Avancés',
    description: 'Insights comportementaux détaillés et métriques en temps réel pour optimiser l\'expérience.',
    label: 'Insights',
    icon: '📊',
    status: 'feature',
    buttonText: 'En savoir plus',
    buttonAction: () => console.log('Analytics clicked')
  },
  {
    color: '#060010',
    title: 'IA Conversationnelle',
    description: 'Reconnaissance vocale en temps réel avec traitement du langage naturel avancé.',
    label: 'Technologie',
    icon: '🎤',
    status: 'feature',
    buttonText: 'Découvrir',
    buttonAction: () => console.log('IA Conversationnelle clicked')
  }
];

const JarvisBento: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <style>
        {`
          .jarvis-bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 200px;
            --glow-color: 132, 0, 255;
            --border-color: rgba(255, 255, 255, 0.1);
            --background-dark: rgba(0, 0, 0, 0.4);
            --white: hsl(0, 0%, 100%);
          }
          
          .jarvis-bento-grid {
            display: grid;
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          @media (min-width: 768px) {
            .jarvis-bento-grid {
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(2, 1fr);
            }
            
            .jarvis-bento-grid .jarvis-card:first-child {
              grid-column: 1;
              grid-row: 1 / span 2;
            }
            
            .jarvis-bento-grid .jarvis-card:nth-child(2) {
              grid-column: 2;
              grid-row: 1;
            }
            
            .jarvis-bento-grid .jarvis-card:nth-child(3) {
              grid-column: 2;
              grid-row: 2;
            }
            
            .jarvis-bento-grid .jarvis-card:nth-child(4) {
              grid-column: 1 / span 2;
              grid-row: 3;
            }
          }
          
          .jarvis-card {
            background: var(--background-dark);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 1.5rem;
            padding: 2rem;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .jarvis-card:hover {
            transform: translateY(-8px);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          
          .jarvis-card-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
          }
          
          .jarvis-card-label {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 1rem;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            color: white;
          }
          
          .jarvis-card-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .jarvis-card-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
            margin: 0;
          }
          
          .jarvis-card-description {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            flex: 1;
          }
          
          .jarvis-card-button {
            margin-top: 1rem;
            align-self: flex-start;
          }
        `}
      </style>

      <Box className="jarvis-bento-section" ref={gridRef} pointerEvents="none">
        <div className="jarvis-bento-grid">
          {jarvisCardData.map((card, index) => (
            <div
              key={index}
              className="jarvis-card"
              onClick={card.buttonAction}
              style={{ pointerEvents: 'auto' }}
            >
              <div className="jarvis-card-label">
                {card.label}
              </div>
              
              <div className="jarvis-card-content">
                <span className="jarvis-card-icon">{card.icon}</span>
                <h3 className="jarvis-card-title">{card.title}</h3>
                <p className="jarvis-card-description">{card.description}</p>
                
                <Button
                  className="jarvis-card-button"
                  colorScheme={card.status === 'active' ? 'blue' : card.status === 'coming-soon' ? 'purple' : 'gray'}
                  variant={card.status === 'coming-soon' ? 'outline' : 'solid'}
                  size="md"
                  disabled={card.status === 'coming-soon'}
                  onClick={(e) => {
                    e.stopPropagation();
                    card.buttonAction();
                  }}
                  pointerEvents="auto"
                >
                  {card.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Box>
    </>
  );
};

export default JarvisBento;
