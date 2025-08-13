import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mock predictions for MVP
  res.status(200).json({
    predictions: [
      { label: 'brake_caliper', name: 'Brake Caliper', confidence: 0.82 },
      { label: 'serpentine_belt', name: 'Serpentine Belt', confidence: 0.11 },
      { label: 'alternator', name: 'Alternator', confidence: 0.07 },
    ]
  })
}
