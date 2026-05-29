/**
 * IFQ636 Assignment 1 — Backend Test Suite
 * Tests all API endpoints across Auth, Course, and Enrollment resource groups.
 * Uses chai-http to fire real HTTP requests against the Express app
 * and a live MongoDB Atlas connection (MONGO_URI from .env / GitHub Secrets).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const chai       = require('chai');
const chaiHttp   = require('chai-http');
const mongoose   = require('mongoose');
const app        = require('../server');
const User       = require('../models/User');
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');

chai.use(chaiHttp);
const { expect } = chai;

// ─── Unique test data (timestamp suffix avoids collisions on re-runs) ──────────
const TS = Date.now();

const STUDENT = {
  name:     'Test Student',
  email:    `student_${TS}@testifq636.com`,
  password: 'password123'
};

const ADMIN = {
  name:     'Test Admin',
  email:    `admin_${TS}@testifq636.com`,
  password: 'adminpass123'
};

const COURSE_DATA = {
  title:       'Introduction to Cloud Computing',
  description: 'Covers AWS, EC2, and deployment fundamentals.',
  instructor:  'Dr. Smith',
  schedule:    'Monday 10am-12pm',
  capacity:    25
};

// ─── Shared state populated during tests ────────────────────────────────────────
let studentToken;
let adminToken;
let studentId;
let courseId;

// ────────────────────────────────────────────────────────────────────────────────
// DATABASE LIFECYCLE
// ────────────────────────────────────────────────────────────────────────────────

before(async function () {
  this.timeout(20000);
  await mongoose.connect(process.env.MONGO_URI);
});

after(async function () {
  this.timeout(10000);
  // Clean up all test documents created during this run
  await User.deleteMany({ email: { $in: [STUDENT.email, ADMIN.email] } });
  await Course.deleteMany({ title: COURSE_DATA.title });
  if (studentId) await Enrollment.deleteMany({ student: studentId });
  await mongoose.disconnect();
});

// ────────────────────────────────────────────────────────────────────────────────
// 1. AUTH TESTS
// ────────────────────────────────────────────────────────────────────────────────

describe('Auth — POST /api/auth/register', () => {

  it('should register a new student and return 201 with a token', async () => {
    const res = await chai.request(app)
      .post('/api/auth/register')
      .send(STUDENT);

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('token');
    expect(res.body.email).to.equal(STUDENT.email);
    expect(res.body).to.not.have.property('password');

    studentToken = res.body.token;
    studentId    = res.body.id;
  });

  it('should return 400 when registering with a duplicate email', async () => {
    const res = await chai.request(app)
      .post('/api/auth/register')
      .send(STUDENT); // same email as above

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('User already exists');
  });

  it('should register the admin user successfully', async () => {
    const res = await chai.request(app)
      .post('/api/auth/register')
      .send(ADMIN);

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('token');

    // Promote to admin role directly in DB (registration always creates 'student')
    await User.findByIdAndUpdate(res.body.id, { role: 'admin' });

    // Re-login to get a token that reflects the updated role in DB
    const login = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password });

    adminToken = login.body.token;
  });

});

describe('Auth — POST /api/auth/login', () => {

  it('should log in with valid credentials and return a token', async () => {
    const res = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: STUDENT.email, password: STUDENT.password });

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('token');
    expect(res.body.email).to.equal(STUDENT.email);
    studentToken = res.body.token; // refresh token
  });

  it('should return 401 with an incorrect password', async () => {
    const res = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: STUDENT.email, password: 'wrongpassword' });

    expect(res).to.have.status(401);
    expect(res.body.message).to.equal('Invalid email or password');
  });

  it('should return 401 for a non-existent email', async () => {
    const res = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'anything' });

    expect(res).to.have.status(401);
  });

});

describe('Auth — GET /api/auth/profile', () => {

  it('should return the authenticated user profile', async () => {
    const res = await chai.request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(200);
    expect(res.body.email).to.equal(STUDENT.email);
    expect(res.body.name).to.equal(STUDENT.name);
    expect(res.body).to.not.have.property('password');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await chai.request(app)
      .get('/api/auth/profile');

    expect(res).to.have.status(401);
  });

  it('should return 401 when an invalid token is provided', async () => {
    const res = await chai.request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res).to.have.status(401);
  });

});

describe('Auth — PUT /api/auth/profile', () => {

  it('should update the user profile and return updated data', async () => {
    const res = await chai.request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ university: 'QUT', address: '2 George St, Brisbane' });

    expect(res).to.have.status(200);
    expect(res.body.university).to.equal('QUT');
    expect(res.body.address).to.equal('2 George St, Brisbane');
  });

  it('should return 401 when updating profile without a token', async () => {
    const res = await chai.request(app)
      .put('/api/auth/profile')
      .send({ university: 'UQ' });

    expect(res).to.have.status(401);
  });

});

// ────────────────────────────────────────────────────────────────────────────────
// 2. COURSE TESTS
// ────────────────────────────────────────────────────────────────────────────────

describe('Courses — GET /api/courses', () => {

  it('should return an array of courses without authentication', async () => {
    const res = await chai.request(app)
      .get('/api/courses');

    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });

});

describe('Courses — POST /api/courses', () => {

  it('should create a course when authenticated', async () => {
    const res = await chai.request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(COURSE_DATA);

    expect(res).to.have.status(201);
    expect(res.body.title).to.equal(COURSE_DATA.title);
    expect(res.body.capacity).to.equal(COURSE_DATA.capacity);
    expect(res.body.enrolled).to.equal(0);

    courseId = res.body._id;
  });

  it('should return 401 when creating a course without a token', async () => {
    const res = await chai.request(app)
      .post('/api/courses')
      .send(COURSE_DATA);

    expect(res).to.have.status(401);
  });

});

describe('Courses — GET /api/courses/:id', () => {

  it('should return a single course by ID', async () => {
    const res = await chai.request(app)
      .get(`/api/courses/${courseId}`);

    expect(res).to.have.status(200);
    expect(res.body._id).to.equal(courseId);
    expect(res.body.title).to.equal(COURSE_DATA.title);
  });

  it('should return 500 for an invalid course ID format', async () => {
    const res = await chai.request(app)
      .get('/api/courses/invalidid123');

    expect(res.status).to.be.oneOf([400, 404, 500]);
  });

});

describe('Courses — PUT /api/courses/:id', () => {

  it('should update a course when authenticated', async () => {
    const res = await chai.request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 50 });

    expect(res).to.have.status(200);
    expect(res.body.capacity).to.equal(50);
  });

  it('should return 401 when updating without a token', async () => {
    const res = await chai.request(app)
      .put(`/api/courses/${courseId}`)
      .send({ capacity: 10 });

    expect(res).to.have.status(401);
  });

});

// ────────────────────────────────────────────────────────────────────────────────
// 3. ENROLLMENT TESTS
// ────────────────────────────────────────────────────────────────────────────────

describe('Enrollments — POST /api/enrollments/:courseId', () => {

  it('should enrol the authenticated student in a course and return 201', async () => {
    const res = await chai.request(app)
      .post(`/api/enrollments/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('student');
    expect(res.body).to.have.property('course');
  });

  it('should return 400 when the student tries to enrol again (duplicate)', async () => {
    const res = await chai.request(app)
      .post(`/api/enrollments/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Already enrolled in this course');
  });

  it('should return 401 when enrolling without a token', async () => {
    const res = await chai.request(app)
      .post(`/api/enrollments/${courseId}`);

    expect(res).to.have.status(401);
  });

});

describe('Enrollments — GET /api/enrollments/my', () => {

  it('should return the student\'s enrolled courses', async () => {
    const res = await chai.request(app)
      .get('/api/enrollments/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.at.least(1);
    expect(res.body[0]).to.have.property('course');
  });

  it('should return 401 when accessed without a token', async () => {
    const res = await chai.request(app)
      .get('/api/enrollments/my');

    expect(res).to.have.status(401);
  });

});

describe('Enrollments — GET /api/enrollments/all', () => {

  it('should return all enrolments when authenticated', async () => {
    const res = await chai.request(app)
      .get('/api/enrollments/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 401 when accessed without a token', async () => {
    const res = await chai.request(app)
      .get('/api/enrollments/all');

    expect(res).to.have.status(401);
  });

});

describe('Enrollments — DELETE /api/enrollments/:courseId (drop)', () => {

  it('should drop the course and return a success message', async () => {
    const res = await chai.request(app)
      .delete(`/api/enrollments/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(200);
    expect(res.body.message).to.equal('Course dropped successfully');
  });

  it('should return 404 when trying to drop a course not enrolled in', async () => {
    const res = await chai.request(app)
      .delete(`/api/enrollments/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(404);
    expect(res.body.message).to.equal('Enrollment not found');
  });

  it('should return 401 when dropping without a token', async () => {
    const res = await chai.request(app)
      .delete(`/api/enrollments/${courseId}`);

    expect(res).to.have.status(401);
  });

});

// ─── Capacity enforcement ───────────────────────────────────────────────────────
describe('Enrollments — Capacity enforcement', () => {

  let smallCourseId;

  before(async function () {
    this.timeout(10000);
    // Create a course with capacity 1
    const res = await chai.request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...COURSE_DATA, title: 'Capacity Test Course', capacity: 1 });

    smallCourseId = res.body._id;

    // Enrol the admin user to fill the course
    await chai.request(app)
      .post(`/api/enrollments/${smallCourseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  after(async function () {
    await Course.findByIdAndDelete(smallCourseId);
    await Enrollment.deleteMany({ course: smallCourseId });
  });

  it('should return 400 when trying to enrol in a full course', async () => {
    const res = await chai.request(app)
      .post(`/api/enrollments/${smallCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Course is full');
  });

});

// ─── Course deletion ────────────────────────────────────────────────────────────
describe('Courses — DELETE /api/courses/:id', () => {

  it('should delete the course when authenticated', async () => {
    const res = await chai.request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.have.status(200);
    expect(res.body.message).to.equal('Course deleted successfully');
  });

  it('should return 401 when deleting without a token', async () => {
    const res = await chai.request(app)
      .delete(`/api/courses/${courseId}`);

    expect(res).to.have.status(401);
  });

});

// ─── Intentional failure — demonstrates test catches incorrect behaviour ────
describe('Auth — Intentional Failure Demo', () => {

  it('should FAIL: wrong status code to demonstrate test failure detection', async () => {
    const res = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'wrong' });

    // Intentionally asserting 200 — API returns 401 — this test will fail
    expect(res).to.have.status(200);
  });

});