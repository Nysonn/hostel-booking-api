import { prisma } from "../db";

export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
    },
  });
}
