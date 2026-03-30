import { Test, TestingModule } from '@nestjs/testing';
import { PreviewMailModule, PreviewMailService, Template } from '@previewmail/nestjs';
import { MongoDBAdapter } from '../src/mongodb.adapter';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('PreviewMailModule with MongoDBAdapter', () => {
  let moduleRef: TestingModule;
  let service: PreviewMailService;
  let mongoServer: MongoMemoryServer;
  let adapter: MongoDBAdapter;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    adapter = new MongoDBAdapter(uri);

    moduleRef = await Test.createTestingModule({
      imports: [
        PreviewMailModule.forRoot({
          apiKey: 'test-api-key',
          storage: adapter,
          allowedOrigins: ['http://localhost:3000'],
          cache: { ttl: 60000, max: 100 }
        }),
      ],
    }).compile();

    service = moduleRef.get<PreviewMailService>(PreviewMailService);
  });

  afterAll(async () => {
    await moduleRef.close();
    await adapter.disconnect();
    await mongoServer.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and retrieve a template (via Cache & DB)', async () => {
    const templateData: Partial<Template> = {
      name: 'Welcome Email',
      alias: 'welcome-test',
      subject: 'Welcome to PreviewMail!',
      htmlBody: '<h1>Hello {{name}}</h1>'
    };

    const saved = await service.create(templateData);
    expect(saved.id).toBeDefined();
    expect(saved.alias).toBe('welcome-test');

    const fetched = await service.findByAlias('welcome-test');
    expect(fetched).toBeDefined();
    expect(fetched?.htmlBody).toBe('<h1>Hello {{name}}</h1>');
  });

  it('should list metadata only for templates', async () => {
    const templates = await service.findAll(1, 10);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].alias).toBe('welcome-test');
    // Ensure body isn't returned in findAll metadata per spec
    expect(templates[0].htmlBody).toBeUndefined();
  });
});
