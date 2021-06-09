const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

describe("User Routes Tests", () => {

    let testUserToken1;
    let testUserToken2;

    beforeEach(async () => {
      await db.query("DELETE FROM messages");
      await db.query("DELETE FROM users");
  
      let u1 = await User.register({
        username: "test1",
        password: "password",
        first_name: "Test1",
        last_name: "TestTest1",
        phone: "+14155550000",
      });

      let u2 = await User.register({
        username: "test2",
        password: "password",
        first_name: "Test2",
        last_name: "TestTest2",
        phone: "+14155550000",
      });

      let m1 = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "message from user test1 to user test2",
      });
  
      let m2 = await Message.create({
        from_username: "test2",
        to_username: "test1",
        body: "message from user test2 to user test1",
      });

      testUserToken1 = jwt.sign({ username: "test1" }, SECRET_KEY);
      testUserToken2 = jwt.sign({ username: "test2" }, SECRET_KEY);

    });

    describe("GET / ", async () => {
        test("can get all users", async () => {
            let response = await request(app)
            .get("/users/")
            .send({_token: testUserToken1});

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                users: [
                  {
                    username: "test1",
                    first_name: "Test1",
                    last_name: "TestTest1",
                    phone: "+14155550000"
                  },
                  {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "TestTest2",
                    phone: "+14155550000"
                  }
                ]
              });
        });

        test("try to get users with no auth", async () => {
            let response = await request(app)
            .get("/users/")

            expect(response.statusCode).toEqual(401);
        });
    });

    describe("GET /:username", async () => {
        test("get user by name", async function () {
            let response = await request(app)
            .get("/users/test1")
            .send({_token: testUserToken1});

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({user: {
                username: "test1",
                first_name: "Test1",
                last_name: "TestTest1",
                phone: "+14155550000",
                join_at: expect.any(String),
                last_login_at: expect.any(String),
              }
            });
        });

        test("try to get a user that does not exist", async () => {
            let response = await request(app)
            .get("/users/fake")
            .send({_token: testUserToken2});

            expect(response.statusCode).toEqual(401);
        });

        test("try to get a user with no auth", async () => {
            let response = await request(app)
            .get("/users/")

            expect(response.statusCode).toEqual(401);
        });
    });

    describe("GET /:username/to ", async () => {

        test("get messages sent to a user", async () => {
            let response = await request(app)
            .get("/users/test1/to")
            .send({_token: testUserToken1});

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ messages: [{
                id: expect.any(Number),
                body: "message from user test2 to user test1",
                sent_at: expect.any(String),
                read_at: null,
                from_user: {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "TestTest2",
                    phone: "+14155550000"
                    }
                }]
            });
        });

        test("try to get messages sent to a user that does not exist", async () => {
            let response = await request(app)
            .get("/users/fake/to")
            .send({_token: testUserToken2});

            expect(response.statusCode).toEqual(401);
        });

        test("try to get messages sent to a user with no auth", async () => {
            let response = await request(app)
            .get("/users/test1/to")

            expect(response.statusCode).toEqual(401);
        });
    });

    describe("GET /:username/from ", async () => {

        test("get messages sent from a user", async () => {
            let response = await request(app)
            .get("/users/test1/from")
            .send({_token: testUserToken1});

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ messages: [{
                id: expect.any(Number),
                body: "message from user test1 to user test2",
                sent_at: expect.any(String),
                read_at: null,
                to_user: {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "TestTest2",
                    phone: "+14155550000"
                    }
                }]
            });
        });

        test("try to get messages sent from a user that does not exist", async () => {
            let response = await request(app)
            .get("/users/fake/from")
            .send({_token: testUserToken2});

            expect(response.statusCode).toEqual(401);
        });

        test("try to get messages sent from a user with no auth", async () => {
            let response = await request(app)
            .get("/users/test1/from")

            expect(response.statusCode).toEqual(401);
        });
    });
});

afterAll(async function () {
    await db.end();
  });