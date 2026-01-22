/**
 * Execution Accumulator Lifecycles
 *
 * 當 execution-accumulator 建立、更新或刪除時，
 * 自動計算相同 execution + calcBy 的 accValue 加總，
 * 並更新到 execution.sumAccumulators
 */

// ============================================================
// Types
// ============================================================

type CalcBy = 'order_price' | 'order_quantity';

interface LifecycleEvent {
  result: any;
  params?: { data?: any };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * 從 lifecycle event 中取得 execution 資訊
 * 返回 { id: number, documentId: string } 或 null
 */
async function getExecutionInfo(event: LifecycleEvent): Promise<{ id: number; documentId: string } | null> {
  const { result, params } = event;

  // 優先從 result 取得（result 中的 execution 可能是被 populate 的物件）
  if (result.execution) {
    if (typeof result.execution === 'object' && result.execution.documentId) {
      return {
        id: result.execution.id,
        documentId: result.execution.documentId,
      };
    }
  }

  // 從 params.data 取得數字 ID，再查詢 documentId
  const exec = params?.data?.execution;
  let numericId: number | null = null;

  if (exec && typeof exec === 'object') {
    // Strapi v5 使用 set 格式: { set: [{ id: 123 }] }
    if (exec.set && Array.isArray(exec.set) && exec.set.length > 0) {
      numericId = exec.set[0].id;
    }
    // 舊格式: { connect: [{ id: 123 }] }
    else if (exec.connect && Array.isArray(exec.connect) && exec.connect.length > 0) {
      numericId = exec.connect[0].id;
    }
  }

  if (!numericId) return null;

  // 用數字 ID 查詢 execution 取得 documentId
  try {
    const executions = await strapi.documents('api::execution.execution').findMany({
      filters: { id: { $eq: numericId } },
      limit: 1,
    });

    if (executions && executions.length > 0) {
      return {
        id: Number(executions[0].id),
        documentId: executions[0].documentId,
      };
    }
  } catch (error) {
    console.error('[getExecutionInfo] Error querying execution:', error);
  }

  return null;
}

/**
 * 從 lifecycle event 中取得 calcBy
 */
function getCalcBy(event: LifecycleEvent): CalcBy | null {
  const { calcBy } = event.result;
  return calcBy === 'order_price' || calcBy === 'order_quantity' ? calcBy : null;
}

/**
 * 計算並更新 execution 的 sumAccumulators
 *
 * 1. 查詢所有相同 execution + calcBy 的 accumulator
 * 2. 加總所有 accValue
 * 3. 更新 execution.sumAccumulators
 */
async function updateExecutionSumAccumulators(
  executionId: string,
  calcBy: CalcBy
): Promise<void> {
  console.log('[updateExecutionSumAccumulators] Starting', { executionId, calcBy });

  // Strapi v5 使用 Document Service API
  const accumulators = await strapi.documents('api::execution-accumulator.execution-accumulator').findMany({
    filters: {
      execution: { documentId: { $eq: executionId } },
      calcBy: { $eq: calcBy },
    },
  });

  console.log('[updateExecutionSumAccumulators] Found accumulators', JSON.stringify(accumulators));

  const sumAccumulators = (accumulators as any[]).reduce(
    (sum, acc) => sum + (acc.accValue || 0),
    0
  );

  console.log('[updateExecutionSumAccumulators] Calculated sumAccumulators', sumAccumulators);

  try {
    // 更新已發布的版本 (status: 'published')
    const updateResult = await strapi.documents('api::execution.execution').update({
      documentId: executionId,
      status: 'published',
      data: { sumAccumulators },
    });
    console.log('[updateExecutionSumAccumulators] Update result', JSON.stringify(updateResult));
  } catch (error) {
    console.error('[updateExecutionSumAccumulators] Update error', error);
  }
}

// ============================================================
// Lifecycle Hooks
// ============================================================

async function handleAccumulatorChange(event: LifecycleEvent): Promise<void> {
  console.log('[Lifecycle] handleAccumulatorChange triggered');
  console.log('[Lifecycle] event.result', JSON.stringify(event.result));
  console.log('[Lifecycle] event.params?.data', JSON.stringify(event.params?.data));

  const executionInfo = await getExecutionInfo(event);
  const calcBy = getCalcBy(event);

  console.log('[Lifecycle] extracted values', { executionInfo, calcBy });

  if (!executionInfo || !calcBy) {
    console.log('[Lifecycle] Missing executionInfo or calcBy, skipping update');
    return;
  }

  await updateExecutionSumAccumulators(executionInfo.documentId, calcBy);
}

export default {
  afterCreate: handleAccumulatorChange,
  afterUpdate: handleAccumulatorChange,
  afterDelete: handleAccumulatorChange,
};
