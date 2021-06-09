const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const app = require("../app");
const db = require("../db");
const Message = require("../models/message");
const User = require("../models/user");

describe("Message Routes Tests", () => {

    let testUserToken;
    let m1;
    let m2;
    let m3;

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

      let u3 = await User.register({
        username: "test3",
        password: "password",
        first_name: "Test3",
        last_name: "TestTest3",
        phone: "+14155550000",
      });

      m1 = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "message from user test1 to user test2",
      });
  
      m2 = await Message.create({
        from_username: "test2",
        to_username: "test1",
        body: "message from user test2 to user test1",
      });

      m3 = await Message.create({
        from_username: "test2",
        to_username: "test3",
        body: "message from user test2 to user test3",
      });

      testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY);
    });

    describe("GET /:id ", () => {

        test("Get message by id from user.", async () => {
            let res = await request(app)
            .get(`/messages/${m1.id}`)
            .send({_token: testUserToken});

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: {
                id: m1.id,
                from_user: {
                  username: "test1",
                  first_name: "Test1",
                  last_name: "TestTest1",
                  phone: "+14155550000",
                },
                to_user: {
                  username: "test2",
                  first_name: "Test2",
                  last_name: "TestTest2",
                  phone: "+14155550000",
                },
                body: "message from user test1 to user test2",
                sent_at: expect.any(String),
                read_at: null,
              }
            });
        });

        test("Get message by id to user.", async () => {
            let res = await request(app)
            .get(`/messages/${m2.id}`)
            .send({_token: testUserToken});

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: {
                id: m2.id,
                to_user: {
                  username: "test1",
                  first_name: "Test1",
                  last_name: "TestTest1",
                  phone: "+14155550000",
                },
                from_user: {
                  username: "test2",
                  first_name: "Test2",
                  last_name: "TestTest2",
                  phone: "+14155550000",
                },
                body: "message from user test2 to user test1",
                sent_at: expect.any(String),
                read_at: null,
              }
            });
        });

        test("Try to get a message that is not to or from the user", async () => {
            let res = await request(app)
            .get(`/messages/${m3.id}`)
            .send({_token: testUserToken});

            expect(res.statusCode).toEqual(401);
        });

        test("Try to get invalid message id.", async () => {
            let res = await request(app)
            .get("/messages/0")
            .send({_token: testUserToken});

            expect(res.statusCode).toEqual(404);
        });

        test("Try to get message with no logged in user.", async () => {
            let res = await request(app)
            .get("/messages/1")

            expect(res.statusCode).toEqual(401);
        });
    });

    describe("POST / ", () => {

        test("Create new message.", async () => {
            let res = await request(app)
            .post("/messages/")
            .send({
                to_username: "test2",
                body: "Another message from user1 to user2.",
                _token: testUserToken });
            expect(res.body).toEqual({
                message: {
                  id: expect.any(Number),
                  from_username: "test1",
                  to_username: "test2",
                  body: "Another message from user1 to user2.",
                  sent_at: expect.any(String)
                }
              });
        });

        test("Try to send message to fake user.", async () => {

            let res = await request(app)
            .post("/messages/")
            .send({
                to_username: "fake",
                body: "Fake message!",
                _token: testUserToken });
            
                expect(res.statusCode).toEqual(500);
        });

        test("Try to send message with no logged in user.", async () => {

            let res = await request(app)
            .post("/messages/")
            .send({
                to_username: "test2",
                body: "This will fail with 401."});
            
                expect(res.statusCode).toEqual(401);
        });

    });

    describe("POST /:id/read ", () => {

        test("Mark a message as read.", async () => {
            let res = await request(app)
            .post(`/messages/${m2.id}/read`)
            .send({ _token: testUserToken });
            
            expect(res.body).toEqual({
                message: {
                  id: m2.id,
                  read_at: expect.any(String),
                }
            });
        });

        test("Try to get message that does not exist.", async () => {
            let response = await request(app)
            .post(`/messages/${m2.id}/read`)
            .send({ _token: "testUserToken" });
      
            expect(response.statusCode).toEqual(401);
          });
        
        test("Try to get message with no logged in user.", async () => {
            let response = await request(app)
            .post("/messages/0/read");
      
            expect(response.statusCode).toEqual(401);
        });
    });
});

afterAll(async function () {
    await db.end();
  });