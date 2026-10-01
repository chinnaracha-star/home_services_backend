import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedCompletionImageType,
  MAX_COMPLETION_IMAGES,
  MIN_COMPLETION_IMAGES,
  requireCompletionImageCount,
} from "../src/middlewares/job-completion-upload.middleware.mjs";
import {
  completeJobForTechnician,
  getCompletionValidationError,
} from "../src/repositories/technician-orders.repository.mjs";

function files(count) {
  return Array.from({ length: count }, () => ({
    mimetype: "image/jpeg",
    buffer: Buffer.from("image"),
  }));
}

test("completion upload requires between three and five images", () => {
  assert.throws(
    () => requireCompletionImageCount(files(MIN_COMPLETION_IMAGES - 1)),
    (error) => error.code === "MINIMUM_COMPLETION_IMAGES_REQUIRED",
  );
  assert.doesNotThrow(() => requireCompletionImageCount(files(3)));
  assert.doesNotThrow(() => requireCompletionImageCount(files(5)));
  assert.throws(
    () => requireCompletionImageCount(files(MAX_COMPLETION_IMAGES + 1)),
    (error) => error.code === "TOO_MANY_COMPLETION_IMAGES",
  );
});

test("completion upload accepts only configured image MIME types", () => {
  assert.equal(isAllowedCompletionImageType("image/jpeg"), true);
  assert.equal(isAllowedCompletionImageType("image/png"), true);
  assert.equal(isAllowedCompletionImageType("image/webp"), true);
  assert.equal(isAllowedCompletionImageType("image/gif"), false);
  assert.equal(isAllowedCompletionImageType("application/pdf"), false);
});

test("job completion validates status and persisted image count", () => {
  assert.equal(
    getCompletionValidationError({ status: "ACCEPTED", imageCount: 3 }),
    null,
  );
  assert.equal(
    getCompletionValidationError({ status: "IN_PROGRESS", imageCount: 5 }),
    null,
  );
  assert.equal(
    getCompletionValidationError({ status: "ACCEPTED", imageCount: 2 }),
    "MINIMUM_COMPLETION_IMAGES_REQUIRED",
  );
  assert.equal(
    getCompletionValidationError({ status: "COMPLETED", imageCount: 3 }),
    "JOB_ALREADY_COMPLETED",
  );
  assert.equal(
    getCompletionValidationError({ status: "CANCELLED", imageCount: 3 }),
    "INVALID_JOB_STATUS",
  );
});

function transactionWithRows(firstRows) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (calls.length === 1) return { rows: firstRows };
      return { rows: [], rowCount: 1 };
    },
  };
  return {
    calls,
    runner: async (callback) => callback(client),
  };
}

test("job completion rejects an assignment not owned by the technician", async () => {
  const fake = transactionWithRows([]);
  const result = await completeJobForTechnician(
    { technicianId: 7, assignmentId: 99 },
    fake.runner,
  );

  assert.equal(result.error, "JOB_NOT_FOUND");
  assert.deepEqual(fake.calls[0].params, [99, 7]);
  assert.equal(fake.calls.length, 1);
});

test("job completion does not update statuses with fewer than three images", async () => {
  const fake = transactionWithRows([
    {
      assignment_id: 9,
      order_id: 10,
      status: "IN_PROGRESS",
      imageCount: 2,
    },
  ]);
  const result = await completeJobForTechnician(
    { technicianId: 7, assignmentId: 9 },
    fake.runner,
  );

  assert.equal(result.error, "MINIMUM_COMPLETION_IMAGES_REQUIRED");
  assert.equal(result.imageCount, 2);
  assert.equal(fake.calls.length, 1);
});

test("job completion updates assignment and order after validation", async () => {
  const fake = transactionWithRows([
    {
      assignment_id: 9,
      order_id: 10,
      status: "ACCEPTED",
      imageCount: 3,
    },
  ]);
  const result = await completeJobForTechnician(
    { technicianId: 7, assignmentId: 9 },
    fake.runner,
  );

  assert.equal(result.error, null);
  assert.equal(result.imageCount, 3);
  assert.equal(fake.calls.length, 3);
  assert.match(fake.calls[1].sql, /SET status = 'COMPLETED'/);
  assert.match(fake.calls[2].sql, /SET status = 'completed'/);
  assert.deepEqual(fake.calls[1].params, [9]);
  assert.deepEqual(fake.calls[2].params, [10]);
});
