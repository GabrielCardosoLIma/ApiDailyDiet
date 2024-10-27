import type { FastifyInstance } from "fastify";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { knex } from "../database";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export async function mealsRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const meals = await knex('meals').where({ user_id: userId }).orderBy('date', 'desc')

        return reply.status(200).send({ meals })
    })

    app.get('/:mealId', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const paramsSchema = z.object({
            mealId: z.string().uuid(),
        })

        const { mealId } = paramsSchema.parse(request.params);

        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const meal = await knex('meals').where({ id: mealId, user_id: userId }).first()

        if (!meal) {
            return reply.status(404).send({ message: 'Meal not found' })
        }

        return reply.status(200).send({ meal })
    })

    app.post('/', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const createMealBodySchema = z.object({
            name: z.string().min(1, "Name is invalid."),
            description: z.string(),
            isWithinDiet: z.boolean(),
            date: z.string(),
        })

        const { name, description, date, isWithinDiet } = createMealBodySchema.parse(request.body);

        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const dataMeal = {
            id: randomUUID(),
            user_id: userId,
            name,
            description,
            is_within_diet: isWithinDiet,
            date,
            created_at: new Date().getTime(),
            updated_at: null
        }

        await knex('meals').insert(dataMeal)

        return reply.status(201).send()
    })

    app.put('/:mealId', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const paramsSchema = z.object({
            mealId: z.string().uuid(),
        })

        const { mealId } = paramsSchema.parse(request.params);

        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const meal = await knex('meals').where({ id: mealId, user_id: userId }).first()

        if (!meal) {
            return reply.status(404).send({ message: 'Meal not found.' })
        }

        const updateMealBodySchema = z.object({
            name: z.string().min(1, "Name is invalid.").optional(),
            description: z.string().optional(),
            isWithinDiet: z.boolean().optional(),
            date: z.string().optional(),
        })

        const { name, description, date, isWithinDiet } = updateMealBodySchema.parse(request.body);

        const dataMeal = {
            name,
            description,
            is_within_diet: isWithinDiet,
            date,
            updated_at: new Date().getTime()
        }

        await knex('meals').where({ id: mealId }).update(dataMeal)

        return reply.status(204).send({ message: 'Meal updated successfully.' })
    })

    app.delete('/:mealId', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const paramsSchema = z.object({
            mealId: z.string().uuid(),
        })

        const { mealId } = paramsSchema.parse(request.params);

        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const meal = await knex('meals').where({ id: mealId, user_id: userId }).first()

        if (!meal) {
            return reply.status(404).send({ message: 'Meal not found.' })
        }

        await knex('meals').where({ id: mealId }).delete()

        return reply.status(204).send({ message: 'Meal deleted successfully.' })
    })

    app.get('/metrics', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const paramsUserSchema = z.object({
            id: z.string().uuid()
        })

        const { id: userId } = paramsUserSchema.parse(request.user);

        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized.' })
        }

        const totalMeals = await knex('meals').where({ user_id: userId }).orderBy('date', 'desc')

        const totalMealsOnDiet = await knex('meals')
            .where({ user_id: userId, is_within_diet: true })
            .count('id', { as: 'total' })
            .first()

        const totalMealsOffDiet = await knex('meals')
            .where({ user_id: userId, is_within_diet: false })
            .count('id', { as: 'total' })
            .first()

        const { bestOnDietSequence } = totalMeals.reduce(
            (acc, meal) => {
                if (meal.is_within_diet) {
                    acc.currentSequence += 1
                } else {
                    acc.currentSequence = 0
                }

                if (acc.currentSequence > acc.bestOnDietSequence) {
                    acc.bestOnDietSequence = acc.currentSequence
                }

                return acc
            },
            { bestOnDietSequence: 0, currentSequence: 0 },
        )

        const dataMetrics = {
            totalMeals: totalMeals.length,
            totalMealsOnDiet: totalMealsOnDiet?.total,
            totalMealsOffDiet: totalMealsOffDiet?.total,
            bestOnDietSequence
        }

        return reply.send(dataMetrics)
    })
}