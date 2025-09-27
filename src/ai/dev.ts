import { config } from 'dotenv';
config();

import '@/ai/flows/get-fare-estimates.ts';
import '@/ai/flows/negotiate-fare.ts';
import '@/ai/flows/support-chat.ts';
import '@/ai/flows/process-rating.ts';
import '@/ai/flows/assist-claim-resolution.ts';
