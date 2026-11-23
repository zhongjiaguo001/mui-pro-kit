import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MessageStore,
  normalizeTypeOpenArgs,
} from './messageStore';

test('normalizeTypeOpenArgs handles string, callback-second-arg, duration+callback, and config object forms', () => {
  const cb = () => {};

  const a = normalizeTypeOpenArgs('success', '保存成功');
  assert.equal(a.type, 'success');
  assert.equal(a.content, '保存成功');
  assert.equal(a.duration, undefined);

  const b = normalizeTypeOpenArgs('warning', '注意余额', cb);
  assert.equal(b.duration, undefined);
  assert.equal(b.onClose, cb);

  const c = normalizeTypeOpenArgs('error', '请求失败', 5, cb);
  assert.equal(c.duration, 5);
  assert.equal(c.onClose, cb);

  const d = normalizeTypeOpenArgs('info', {
    content: '配置对象',
    key: 'custom-k',
    duration: 0,
    closable: true,
  });
  assert.equal(d.type, 'info');
  assert.equal(d.key, 'custom-k');
  assert.equal(d.duration, 0);
  assert.equal(d.closable, true);
});

test('MessageStore supports in-place update by key without duplicating or triggering maxCount eviction', () => {
  const store = new MessageStore({ maxCount: 2 }, { exitDurationMs: 0 });
  let closedCount = 0;

  const handle = store.open({
    key: 'upload',
    type: 'loading',
    content: '上传中...',
    duration: 0,
    onClose: () => {
      closedCount += 1;
    },
  });
  store.open({ key: 'other', type: 'info', content: '辅助提示', duration: 0 });
  assert.equal(store.getSnapshot().length, 2);

  // Updating 'upload' in place must NOT evict 'other' and must increment updateCount
  store.open({
    key: 'upload',
    type: 'success',
    content: '上传完成',
    duration: 0,
  });

  const snap = store.getSnapshot();
  assert.equal(snap.length, 2);
  assert.equal(snap[0].key, 'upload');
  assert.equal(snap[0].type, 'success');
  assert.equal(snap[0].content, '上传完成');
  assert.equal(snap[0].updateCount, 1);
  assert.equal(closedCount, 0);

  // Calling handle() closes the updated entry and fires onClose exactly once
  handle();
  handle();
  assert.equal(closedCount, 1);
  assert.equal(store.getSnapshot().length, 1);
  assert.equal(store.getSnapshot()[0].key, 'other');
  store.destroy();
});

test('MessageStore enforces FIFO maxCount eviction and fires onClose on evicted notices', () => {
  const store = new MessageStore({ maxCount: 3 }, { exitDurationMs: 0 });
  const closedKeys: string[] = [];

  for (let i = 1; i <= 5; i += 1) {
    store.open({
      key: `k${i}`,
      type: 'info',
      content: `消息 ${i}`,
      duration: 0,
      onClose: () => closedKeys.push(`k${i}`),
    });
  }

  assert.deepEqual(
    store.getSnapshot().map((m) => m.key),
    ['k3', 'k4', 'k5'],
  );
  assert.deepEqual(closedKeys, ['k1', 'k2']);
  store.destroy();
});

test('MessageStore returns PromiseLike handle that resolves upon close or auto-dismiss', async () => {
  const store = new MessageStore({}, { exitDurationMs: 0 });
  let thenOrder: string[] = [];

  const h1 = store.open({
    key: 'step1',
    type: 'loading',
    content: '步骤 1',
    duration: 0.04,
    onClose: () => thenOrder.push('onClose'),
  });

  await h1.then(() => {
    thenOrder.push('then');
  });

  assert.deepEqual(thenOrder, ['onClose', 'then']);
  assert.equal(store.getSnapshot().length, 0);
});

test('MessageStore pause/resume preserves remaining time accurately', () => {
  let fakeNow = 1000;
  const store = new MessageStore(
    { duration: 3, pauseOnHover: true },
    { exitDurationMs: 0, now: () => fakeNow },
  );

  store.open({ key: 'hover-test', type: 'info', content: '悬停暂停测试', duration: 3 });
  assert.equal(store.getRemainingMs('hover-test'), 3000);

  // Advance 1200ms then pause
  fakeNow += 1200;
  store.pause('hover-test');
  assert.equal(store.getRemainingMs('hover-test'), 1800);

  // Wait 5000ms while paused -> remaining must stay 1800ms
  fakeNow += 5000;
  assert.equal(store.getRemainingMs('hover-test'), 1800);

  // Resume -> remaining starts counting down from 1800ms
  store.resume('hover-test');
  fakeNow += 800;
  assert.equal(store.getRemainingMs('hover-test'), 1000);

  store.destroy();
});

test('MessageStore destroy(key) vs destroy() cleans all items and supports high-throughput bursts', () => {
  const store = new MessageStore({ maxCount: 5 }, { exitDurationMs: 0 });
  let closedCount = 0;

  const t0 = performance.now();
  for (let i = 0; i < 2000; i += 1) {
    store.open({
      key: `burst-${i}`,
      type: i % 2 === 0 ? 'info' : 'success',
      content: `Burst ${i}`,
      duration: 0,
      onClose: () => {
        closedCount += 1;
      },
    });
  }
  const elapsed = performance.now() - t0;

  assert.equal(store.getSnapshot().length, 5);
  assert.equal(closedCount, 1995);
  assert.ok(elapsed < 500, `2000 burst messages took ${elapsed.toFixed(1)}ms`);

  store.destroy('burst-1999');
  assert.equal(store.getSnapshot().length, 4);
  assert.equal(closedCount, 1996);

  store.destroy();
  assert.equal(store.getSnapshot().length, 0);
  assert.equal(closedCount, 2000);
});

test('MessageStore revives a closing key with a fresh Promise and onClose callback', async () => {
  const store = new MessageStore({ maxCount: 2 }, { exitDurationMs: 120 });
  const events: string[] = [];

  const h1 = store.open({
    key: 'revive-k',
    type: 'info',
    content: '第一次',
    duration: 0,
    onClose: () => events.push('close-1'),
  });
  h1(); // Now closing=true, settled=true, exitTimer pending
  await h1;
  assert.deepEqual(events, ['close-1']);
  assert.equal(store.getSnapshot()[0]?.closing, true);

  // Re-open the same key before exitDurationMs expires
  const h2 = store.open({
    key: 'revive-k',
    type: 'success',
    content: '重新唤醒',
    duration: 0,
    onClose: () => events.push('close-2'),
  });

  const snap = store.getSnapshot();
  assert.equal(snap.length, 1);
  assert.equal(snap[0].closing, false);
  assert.equal(snap[0].content, '重新唤醒');

  let h2Resolved = false;
  const p2 = h2.then(() => {
    h2Resolved = true;
  });
  await Promise.resolve();
  assert.equal(h2Resolved, false, 'Revived handle must not resolve prematurely');

  h2();
  await p2;
  assert.equal(h2Resolved, true);
  assert.deepEqual(events, ['close-1', 'close-2']);
  store.destroy();
});

test('MessageStore handles numeric key=0, pauseOnHover=false, dynamic maxCount shrink, and burst DOM bounding', () => {
  let fakeNow = 5000;
  const store = new MessageStore(
    { maxCount: 3, duration: 3, pauseOnHover: false },
    { exitDurationMs: 180, now: () => fakeNow },
  );

  // key=0 must not be treated as falsy
  store.open({ key: 0, type: 'info', content: '零键测试', duration: 3 });
  assert.equal(store.getSnapshot()[0].key, '0');

  // pauseOnHover: false ignores pause()
  fakeNow += 1000;
  store.pause('0');
  fakeNow += 500;
  assert.equal(store.getRemainingMs('0'), 1500);

  // High-frequency 5,000-message burst with realistic 180ms exit transitions must cap total snapshot nodes
  const t0 = performance.now();
  for (let i = 0; i < 5000; i += 1) {
    store.open({
      key: `storm-${i}`,
      type: 'warning',
      content: `Storm ${i}`,
      duration: 0,
    });
  }
  const elapsed = performance.now() - t0;
  const snap = store.getSnapshot();
  const activeCount = snap.filter((m) => !m.closing).length;

  assert.equal(activeCount, 3, 'Active notices strictly capped at maxCount=3');
  assert.ok(
    snap.length <= 6,
    `Total DOM-bound entries (active + exiting) should be <= 6, got ${snap.length}`,
  );
  assert.ok(elapsed < 400, `5000-message burst took ${elapsed.toFixed(1)}ms`);

  // Dynamic setConfig shrinking maxCount from 3 -> 1 evicts 2 active notices immediately
  store.setConfig({ maxCount: 1 });
  const afterShrinkActive = store.getSnapshot().filter((m) => !m.closing);
  assert.equal(afterShrinkActive.length, 1);
  assert.equal(afterShrinkActive[0].key, 'storm-4999');

  store.destroy();
  assert.equal(store.getSnapshot().length, 0);
});
