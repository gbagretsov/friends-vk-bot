import {VkPoll} from '../../vk/model/VkPoll';
import {VkUser} from '../../vk/model/VkUser';

export type MissingVoteMessageGenerator = (poll: VkPoll, missingVoters: number[], conversationMembers: VkUser[]) => string;
