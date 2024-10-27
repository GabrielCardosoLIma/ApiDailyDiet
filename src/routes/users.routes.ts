import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";

export async function usersRoutes(app: FastifyInstance) {
    app.post('/', async (request, reply) => {
        const createUsersBodySchema = z.object({
            name: z.string().min(1, "Name is invalid."),
            email: z.string().email(),
            avatarUrl: z.string().optional()
        })

        const { name, email, avatarUrl } = createUsersBodySchema.parse(request.body);

        const userByEmail = await knex('users').where({ email }).first()

        if (userByEmail) {
            return reply.status(400).send({ message: 'User already exists.' })
        }

        let sessionId = request.cookies.sessionId;

        if (!sessionId) {
            sessionId = randomUUID();

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            })
        }

        const dataUser = {
            id: randomUUID(),
            name,
            email,
            avatar_url: avatarUrl,
            session_id: sessionId
        }

        await knex('users').insert(dataUser)

        return reply.status(201).send()
    })
}