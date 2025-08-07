import { PrismaClient } from '@prisma/client';
import { CreateCollectionDto } from '../dtos/collectionDto';

const prisma = new PrismaClient();

export const createCollection = async (userId: number, collectionData: CreateCollectionDto) => {
  const collection = await prisma.collection.create({
    data: {
      userId,
      title: collectionData.title,
      description: collectionData.description,
      visibility: collectionData.visibility,
    },
  });

  return collection;
};
