import { app } from "../src/app";
import { execSync } from "node:child_process";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe('Meals routes', () => {
    beforeAll(async () => {
        await app.ready()
    });

    afterAll(async () => {
        await app.close()
    });

    beforeEach(() => {
        execSync('npm run knex-rollback --all')
        execSync('npm run knex-latest')
    });

    it('Should be able to create a new meal', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                isWithinDiet: true,
                date: "2024-10-26T12:30:00Z"
            })
            .expect(201)
    });

    it('Should be able to show a single meal', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                isWithinDiet: true,
                date: "2024-10-26T12:30:00Z"
            })
            .expect(201)

        const mealsResponse = await request(app.server)
            .get('/meals')
            .set('Cookie', cookies)
            .expect(200)

        const mealId = mealsResponse.body.meals[0].id;

        const mealResponse = await request(app.server)
            .get(`/meals/${mealId}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(mealResponse.body).toEqual({
            meal: {
                id: expect.any(String),
                user_id: expect.any(String),
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                is_within_diet: 1,
                date: "2024-10-26T12:30:00Z",
                created_at: expect.any(Number),
                updated_at: null
            }
        })
    });

    it('Should be able to list all meals from a user', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                isWithinDiet: true,
                date: "2024-10-26T12:30:00Z"
            })
            .expect(201)

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Dessert",
                description: "Chocolate cake with frosting",
                isWithinDiet: false,
                date: "2024-10-26T15:00:00Z"
            })
            .expect(201);

        const mealsResponse = await request(app.server)
            .get('/meals')
            .set('Cookie', cookies)
            .expect(200);

        expect(mealsResponse.body.meals).toHaveLength(2)
        expect(mealsResponse.body.meals[0].name).toBe('Dessert')
        expect(mealsResponse.body.meals[1].name).toBe('Healthy Lunch')
    });

    it('Should be able to update a single meal', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                isWithinDiet: true,
                date: "2024-10-26T12:30:00Z"
            })
            .expect(201)

        const mealsResponse = await request(app.server)
            .get('/meals')
            .set('Cookie', cookies)
            .expect(200)

        const mealId = mealsResponse.body.meals[0].id;

        await request(app.server)
            .put(`/meals/${mealId}`)
            .set('Cookie', cookies)
            .send({
                name: "Dessert",
                description: "Chocolate cake with frosting",
                isWithinDiet: false,
                date: "2024-10-26T15:00:00Z"
            })
            .expect(204)

        const mealUpdatedResponse = await request(app.server)
            .get(`/meals/${mealId}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(mealUpdatedResponse.body).toEqual({
            meal: {
                id: expect.any(String),
                user_id: expect.any(String),
                name: "Dessert",
                description: "Chocolate cake with frosting",
                date: "2024-10-26T15:00:00Z",
                is_within_diet: 0,
                created_at: expect.any(Number),
                updated_at: expect.any(Number)
            }
        })
    });

    it('Should be able to delete a single meal', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: "Healthy Lunch",
                description: "Salad with grilled chicken and quinoa",
                isWithinDiet: true,
                date: "2024-10-26T12:30:00Z"
            })
            .expect(201)

        const mealsResponse = await request(app.server)
            .get('/meals')
            .set('Cookie', cookies)
            .expect(200)

        const mealId = mealsResponse.body.meals[0].id;

        await request(app.server)
            .delete(`/meals/${mealId}`)
            .set('Cookie', cookies)
            .expect(204)
    });

    it('Should be able to get metrics from a user', async () => {
        const userResponse = await request(app.server)
            .post('/users')
            .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
            .expect(201)

        const cookies = userResponse.get('Set-Cookie') || [];

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: 'Breakfast',
                description: "It's a breakfast",
                isWithinDiet: true,
                date: '2021-01-01T08:00:00',
            })
            .expect(201)

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: 'Lunch',
                description: "It's a lunch",
                isWithinDiet: false,
                date: '2021-01-01T12:00:00',
            })
            .expect(201)

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: 'Snack',
                description: "It's a snack",
                isWithinDiet: true,
                date: '2021-01-01T15:00:00',
            })
            .expect(201)

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: 'Dinner',
                description: "It's a dinner",
                isWithinDiet: true,
                date: '2021-01-01T20:00:00',
            })

        await request(app.server)
            .post('/meals')
            .set('Cookie', cookies)
            .send({
                name: 'Breakfast',
                description: "It's a breakfast",
                isWithinDiet: true,
                date: '2021-01-02T08:00:00',
            })

        const metricsResponse = await request(app.server)
            .get('/meals/metrics')
            .set('Cookie', cookies)
            .expect(200)

        expect(metricsResponse.body).toEqual({
            totalMeals: 5,
            totalMealsOnDiet: 4,
            totalMealsOffDiet: 1,
            bestOnDietSequence: 3
        })
    });
});