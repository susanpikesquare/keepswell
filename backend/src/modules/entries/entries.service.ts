import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry, Journal, Participant, MediaAttachment, User } from '../../database/entities';
import { SimulateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class EntriesService {
  private readonly logger = new Logger(EntriesService.name);

  constructor(
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(MediaAttachment)
    private mediaRepo: Repository<MediaAttachment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private async getUserByClerkId(clerkId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByJournal(
    journalId: string,
    clerkId: string,
    options?: { page?: number; limit?: number },
  ) {
    const user = await this.getUserByClerkId(clerkId);

    // Verify user owns the journal
    const journal = await this.journalRepo.findOne({
      where: { id: journalId, owner_id: user.id },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await this.entryRepo.findAndCount({
      where: { journal_id: journalId, is_hidden: false },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, clerkId: string): Promise<Entry> {
    const user = await this.getUserByClerkId(clerkId);

    const entry = await this.entryRepo.findOne({
      where: { id },
      relations: ['journal', 'participant', 'media_attachments'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to view this entry');
    }

    return entry;
  }

  /**
   * Simulate an SMS entry for testing purposes
   * This bypasses Twilio and creates an entry directly
   */
  async simulateEntry(
    journalId: string,
    clerkId: string,
    dto: SimulateEntryDto,
  ): Promise<Entry> {
    const user = await this.getUserByClerkId(clerkId);

    // Verify user owns the journal
    const journal = await this.journalRepo.findOne({
      where: { id: journalId, owner_id: user.id },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Verify participant exists and belongs to this journal
    const participant = await this.participantRepo.findOne({
      where: { id: dto.participant_id, journal_id: journalId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Determine entry type
    let entryType: 'text' | 'photo' | 'mixed' = dto.entry_type || 'text';
    if (dto.media_urls && dto.media_urls.length > 0) {
      entryType = dto.content ? 'mixed' : 'photo';
    }

    // Create the entry
    const entry = await this.entryRepo.save({
      journal_id: journalId,
      participant_id: participant.id,
      content: dto.content,
      entry_type: entryType,
      is_hidden: false,
      is_pinned: false,
    });

    // Create media attachments if provided
    if (dto.media_urls && dto.media_urls.length > 0) {
      for (const url of dto.media_urls) {
        await this.mediaRepo.save({
          entry_id: entry.id,
          original_url: url,
          stored_url: url, // In test mode, use the URL directly
          media_type: this.detectMediaType(url),
        });
      }
    }

    // Update participant's last response time
    await this.participantRepo.update(participant.id, {
      last_response_at: new Date(),
    });

    this.logger.log(
      `Simulated entry created for participant ${participant.display_name} in journal ${journal.title}`,
    );

    // Return with relations
    return this.entryRepo.findOne({
      where: { id: entry.id },
      relations: ['participant', 'media_attachments'],
    }) as Promise<Entry>;
  }

  async update(
    id: string,
    clerkId: string,
    updates: { is_hidden?: boolean; is_pinned?: boolean },
  ): Promise<Entry> {
    await this.findOne(id, clerkId);
    await this.entryRepo.update(id, updates);
    return this.entryRepo.findOne({
      where: { id },
      relations: ['participant', 'media_attachments'],
    }) as Promise<Entry>;
  }

  async remove(id: string, clerkId: string): Promise<void> {
    await this.findOne(id, clerkId);
    await this.entryRepo.delete(id);
  }

  private detectMediaType(url: string): string {
    const lower = url.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return 'image';
    }
    if (lower.match(/\.(mp4|mov|avi|webm)$/)) {
      return 'video';
    }
    return 'image'; // Default to image
  }

  /**
   * Generate demo data for a journal to showcase the app
   */
  async generateDemoData(journalId: string, clerkId: string): Promise<{ entriesCreated: number; participantsCreated: number }> {
    const user = await this.getUserByClerkId(clerkId);

    // Verify user owns the journal
    const journal = await this.journalRepo.findOne({
      where: { id: journalId, owner_id: user.id },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Demo participants based on template type
    const demoParticipants = this.getDemoParticipants(journal.template_type);

    // Check existing participants
    let existingParticipants = await this.participantRepo.find({
      where: { journal_id: journalId },
    });

    // Create demo participants if we have less than needed
    const participantsToCreate = demoParticipants.slice(existingParticipants.length);
    for (const p of participantsToCreate) {
      const newParticipant = await this.participantRepo.save({
        journal_id: journalId,
        phone_number: p.phone,
        display_name: p.name,
        relationship: p.relationship,
        status: 'active',
        opted_in: true,
      });
      existingParticipants.push(newParticipant);
    }

    // Get demo entries based on template type
    const demoEntries = this.getDemoEntries(journal.template_type);

    // Create entries spread over the past few weeks
    let entriesCreated = 0;
    const now = new Date();

    for (let i = 0; i < demoEntries.length; i++) {
      const entry = demoEntries[i];
      const participant = existingParticipants[i % existingParticipants.length];

      // Spread entries over past 30 days
      const daysAgo = Math.floor((i / demoEntries.length) * 30);
      const hoursOffset = Math.floor(Math.random() * 12);
      const entryDate = new Date(now);
      entryDate.setDate(entryDate.getDate() - daysAgo);
      entryDate.setHours(9 + hoursOffset, Math.floor(Math.random() * 60));

      const newEntry = await this.entryRepo.save({
        journal_id: journalId,
        participant_id: participant.id,
        content: entry.content,
        entry_type: entry.hasPhoto ? 'mixed' : 'text',
        is_hidden: false,
        is_pinned: entry.isPinned || false,
        created_at: entryDate,
      });

      // Add demo photo if specified
      if (entry.hasPhoto && entry.photoUrl) {
        await this.mediaRepo.save({
          entry_id: newEntry.id,
          original_url: entry.photoUrl,
          stored_url: entry.photoUrl,
          media_type: 'image',
        });
      }

      entriesCreated++;
    }

    // Update participant last response times
    for (const participant of existingParticipants) {
      await this.participantRepo.update(participant.id, {
        last_response_at: new Date(),
      });
    }

    this.logger.log(`Generated ${entriesCreated} demo entries for journal ${journal.title}`);

    return {
      entriesCreated,
      participantsCreated: participantsToCreate.length,
    };
  }

  private getDemoParticipants(templateType: string): Array<{ name: string; phone: string; relationship: string }> {
    const participants: Record<string, Array<{ name: string; phone: string; relationship: string }>> = {
      family: [
        { name: 'Grandma Rose', phone: '+15551000001', relationship: 'Grandmother' },
        { name: 'Dad', phone: '+15551000002', relationship: 'Father' },
        { name: 'Mom', phone: '+15551000003', relationship: 'Mother' },
        { name: 'Uncle Mike', phone: '+15551000004', relationship: 'Uncle' },
        { name: 'Aunt Sarah', phone: '+15551000005', relationship: 'Aunt' },
      ],
      friends: [
        { name: 'Alex', phone: '+15552000001', relationship: 'Best Friend' },
        { name: 'Jordan', phone: '+15552000002', relationship: 'College Roommate' },
        { name: 'Sam', phone: '+15552000003', relationship: 'Work Friend' },
        { name: 'Taylor', phone: '+15552000004', relationship: 'Neighbor' },
      ],
      romantic: [
        { name: 'My Love', phone: '+15553000001', relationship: 'Partner' },
        { name: 'Me', phone: '+15553000002', relationship: 'Self' },
      ],
      vacation: [
        { name: 'Travel Buddy', phone: '+15554000001', relationship: 'Friend' },
        { name: 'Me', phone: '+15554000002', relationship: 'Self' },
        { name: 'Local Guide', phone: '+15554000003', relationship: 'Guide' },
      ],
      custom: [
        { name: 'Participant 1', phone: '+15555000001', relationship: 'Member' },
        { name: 'Participant 2', phone: '+15555000002', relationship: 'Member' },
        { name: 'Participant 3', phone: '+15555000003', relationship: 'Member' },
      ],
    };
    return participants[templateType] || participants.custom;
  }

  private getDemoEntries(templateType: string): Array<{ content: string; hasPhoto?: boolean; photoUrl?: string; isPinned?: boolean }> {
    // Sample Unsplash photos for demo
    const familyPhotos = [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
      'https://images.unsplash.com/photo-1559734840-f9509ee5677f?w=800',
      'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800',
    ];
    const friendPhotos = [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=800',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800',
    ];
    const romanticPhotos = [
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
    ];
    const vacationPhotos = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    ];

    const entries: Record<string, Array<{ content: string; hasPhoto?: boolean; photoUrl?: string; isPinned?: boolean }>> = {
      family: [
        { content: "I remember when you were just five years old, and you insisted on helping me bake cookies. You were covered in flour from head to toe, but you were so proud of those misshapen cookies. That's still one of my favorite memories.", isPinned: true },
        { content: "The best advice my father ever gave me was 'Always be kind, even when it's hard.' I've tried to live by that every day.", hasPhoto: true, photoUrl: familyPhotos[0] },
        { content: "Our family road trip to the Grand Canyon in '98 was magical. Twelve hours in the car with three kids, and somehow we all came out of it laughing. The view when we finally arrived made it all worth it." },
        { content: "Your grandmother used to say 'A house is made of walls and beams; a home is built with love and dreams.' I think about that every time I walk through our front door.", hasPhoto: true, photoUrl: familyPhotos[1] },
        { content: "The tradition of Sunday dinners started with my parents. No matter how busy life got, we always gathered around the table. It was never about the food – it was about being together." },
        { content: "I still have the letter you wrote me when you were seven. You said 'I love you bigger than the sky and all the stars.' I keep it in my nightstand.", isPinned: true },
        { content: "Teaching you to ride a bike was terrifying and wonderful. You fell so many times, but you never gave up. That determination is still your superpower.", hasPhoto: true, photoUrl: familyPhotos[2] },
        { content: "The secret family recipe for apple pie? It's not really about the ingredients. It's about making it together, sharing stories while we peel the apples." },
        { content: "When your grandfather came to this country, he had nothing but hope and courage. Everything we have today started with his brave decision." },
        { content: "I wish you could have met your great-aunt Helen. She had the most contagious laugh – you could hear it from three rooms away. You have her smile." },
      ],
      friends: [
        { content: "Remember when we got lost in Barcelona and ended up at that tiny restaurant where nobody spoke English? Best paella of my life, and we made friends with the whole kitchen staff somehow.", hasPhoto: true, photoUrl: friendPhotos[0], isPinned: true },
        { content: "You're the only person who knows about my secret talent for bad karaoke. That night at the dive bar in college is still legendary." },
        { content: "When I got the news about my dad, you drove four hours in the middle of the night just to sit with me. You didn't even say anything – you just made tea and stayed. That meant everything." },
        { content: "Our tradition of terrible movie nights started as a joke, but honestly it's the highlight of my month. Last week's pick was magnificently awful.", hasPhoto: true, photoUrl: friendPhotos[1] },
        { content: "I still can't believe we actually did that spontaneous road trip to see the northern lights. Sleeping in the car, eating gas station snacks, but those lights... worth every uncomfortable moment." },
        { content: "You always know exactly when to send a meme. Somehow you sense when I'm having a rough day. That's a real friendship superpower.", hasPhoto: true, photoUrl: friendPhotos[2] },
        { content: "Thanks for being the person I can ugly cry in front of without any judgment. And for always having ice cream ready." },
        { content: "Our pact to try one new thing each month has led to some weird experiences. Goat yoga was definitely the strangest. But I wouldn't trade those memories for anything." },
      ],
      romantic: [
        { content: "The moment I knew I loved you was surprisingly ordinary. You were just making coffee, humming that song you always hum, and I thought: this is it. This is everything.", isPinned: true },
        { content: "Our first dance at the wedding. I was so nervous I stepped on your feet at least five times. You just laughed and pulled me closer.", hasPhoto: true, photoUrl: romanticPhotos[0] },
        { content: "I love how you still leave little notes in my lunch. After all these years, finding a sticky note with a heart still makes my whole day better." },
        { content: "Remember our first apartment? The one with the leaky faucet and the neighbor who played accordion at midnight? I'd live there again in a heartbeat if it meant being with you.", hasPhoto: true, photoUrl: romanticPhotos[1] },
        { content: "You make the ordinary feel extraordinary. Grocery shopping with you is an adventure. Cooking dinner together is a celebration. Even doing laundry feels like quality time." },
        { content: "That rainy Sunday when we stayed in bed all day watching old movies and eating takeout – I think about that day a lot. We didn't do anything special, but it was perfect." },
        { content: "I love how you always save the last bite of dessert for me, even when it's your favorite.", isPinned: true },
        { content: "Growing old with you doesn't scare me. Every grey hair and laugh line just means more time together, more memories, more us." },
      ],
      vacation: [
        { content: "Day 1: Finally made it! The flight was long but stepping out into the warm air made it all worth it. The adventure begins.", hasPhoto: true, photoUrl: vacationPhotos[0], isPinned: true },
        { content: "Got completely lost trying to find the famous local market. Ended up in a neighborhood where an elderly woman invited us in for tea. Best detour ever." },
        { content: "The sunrise from the mountain top this morning was unreal. Woke up at 4am and hiked in the dark, but those colors... I'll never forget them.", hasPhoto: true, photoUrl: vacationPhotos[1] },
        { content: "Tried the local delicacy today. Not gonna lie, I was skeptical at first, but it was actually incredible. Travel really does expand your palate." },
        { content: "Met some fellow travelers at the hostel. We're planning to explore the old town together tomorrow. Love how travel brings strangers together.", hasPhoto: true, photoUrl: vacationPhotos[2] },
        { content: "Today I just wandered. No map, no plan, no agenda. Got lost in winding streets, discovered hidden courtyards, watched life happen around me. Sometimes the best adventures are unplanned." },
        { content: "The local guide told us stories about this place that you won't find in any book. History comes alive when it's told by someone who lives it." },
        { content: "Last night here. Feeling grateful, a little sad, and already planning when to come back. This place changed me somehow." },
      ],
      custom: [
        { content: "This is a sample entry to show how the journal looks. Entries can be short thoughts or longer reflections." },
        { content: "Participants receive prompts via text message and can reply with their memories, stories, and photos." },
        { content: "Every response becomes part of your shared memory book, preserved for years to come." },
        { content: "You can customize the prompts, schedule, and visual theme to match your needs." },
      ],
    };

    return entries[templateType] || entries.custom;
  }
}
