import { DataSource } from 'typeorm';
import { JournalTemplate, Prompt } from '../entities';

export async function seedFamilyTemplate(dataSource: DataSource): Promise<void> {
  const templateRepo = dataSource.getRepository(JournalTemplate);
  const promptRepo = dataSource.getRepository(Prompt);

  // Check if template already exists
  const existing = await templateRepo.findOne({ where: { type: 'family', is_system_template: true } });
  if (existing) {
    console.log('Family template already exists, skipping seed');
    return;
  }

  // Create family template
  const template = await templateRepo.save({
    name: 'Family Memories',
    type: 'family',
    description: 'Collect cherished memories and stories from your family members',
    is_system_template: true,
  });

  // Create prompts for family template
  const familyPrompts = [
    { text: "What's your favorite childhood memory?", category: 'memories', sequence_order: 1 },
    { text: "Tell us about a family tradition you cherish.", category: 'traditions', sequence_order: 2 },
    { text: "What's the best advice you ever received from a family member?", category: 'wisdom', sequence_order: 3 },
    { text: "Describe a meal that brings back special memories.", category: 'memories', sequence_order: 4 },
    { text: "What's something you're grateful for about our family?", category: 'gratitude', sequence_order: 5 },
    { text: "Share a funny story from a family gathering.", category: 'stories', sequence_order: 6 },
    { text: "What family recipe has been passed down through generations?", category: 'traditions', sequence_order: 7 },
    { text: "Describe your favorite family vacation or trip.", category: 'memories', sequence_order: 8 },
    { text: "What values do you hope to pass on to future generations?", category: 'wisdom', sequence_order: 9 },
    { text: "Tell us about a challenge our family overcame together.", category: 'stories', sequence_order: 10 },
    { text: "What's your earliest memory of our family home?", category: 'memories', sequence_order: 11 },
    { text: "Share a lesson you learned from a grandparent.", category: 'wisdom', sequence_order: 12 },
    { text: "What holiday tradition means the most to you?", category: 'traditions', sequence_order: 13 },
    { text: "Describe a moment when you felt proud of our family.", category: 'milestones', sequence_order: 14 },
    { text: "What song or music reminds you of family?", category: 'memories', sequence_order: 15 },
    { text: "Tell us about a family member who inspired you.", category: 'stories', sequence_order: 16 },
    { text: "What's something unique about our family?", category: 'stories', sequence_order: 17 },
    { text: "Share a memory of a birthday celebration.", category: 'milestones', sequence_order: 18 },
    { text: "What do you love most about being part of this family?", category: 'gratitude', sequence_order: 19 },
    { text: "Describe a perfect family day together.", category: 'memories', sequence_order: 20 },
  ];

  for (const prompt of familyPrompts) {
    await promptRepo.save({
      ...prompt,
      template_id: template.id,
      is_custom: false,
    });
  }

  console.log(`Seeded family template with ${familyPrompts.length} prompts`);
}
