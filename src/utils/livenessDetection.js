import { http } from './http';

/**
 * 视频活体检测初始化接口
 * @param {Object} params - 请求参数
 * @param {string} [params.sessionId] - 会话ID，用于释放已初始化的会话
 * @param {string} params.tradingFlowNO - 交易流水号（必需）
 * @param {string} params.channel - 渠道编码（必需）
 * @param {string} [params.tradingCode] - 交易编码
 * @param {string} params.sceneNo - 场景编码（必需）
 * @param {string} [params.deviceType] - 设备型号
 * @param {string} [params.mobileSystem] - 手机系统
 * @param {string} [params.browserKernel] - 浏览器内核
 * @param {string} [params.browserKernelVersion] - 浏览器内核版本
 * @param {string} [params.systemType] - 系统类型
 * @param {string} [params.browserContent] - 浏览器内容
 * @param {string} [params.devicePrint] - 设备指纹
 * @param {string} [params.sdkVersion] - SDK版本
 * @param {string} [params.ctftype] - 证件类型
 * @param {string} [params.ctfno] - 证件号码
 * @param {string} [params.ctfname] - 证件名称
 * @param {string} [params.customerId] - 客户ID
 * @param {string} params.orgCode - 组织编码（必需）
 * @returns {Promise} - 返回接口响应Promise
 */
export function initializeVideoLiveness(params) {
  // 验证必需参数
  const requiredParams = ['tradingFlowNO', 'channel', 'sceneNo', 'orgCode'];
  const missingParams = requiredParams.filter(param => !params[param]);
  if (missingParams.length > 0) {
    return Promise.reject(new Error(`缺少必需参数: ${missingParams.join(', ')}`));
  }

  // 构造请求参数（过滤undefined值）
  const requestParams = {
    sessionId: params.sessionId || '',
    tradingFlowNO: params.tradingFlowNO,
    channel: params.channel,
    tradingCode: params.tradingCode || '',
    sceneNo: params.sceneNo,
    deviceType: params.deviceType || '',
    mobileSystem: params.mobileSystem || '',
    browserKernel: params.browserKernel || '',
    browserKernelVersion: params.browserKernelVersion || '',
    systemType: params.systemType || '',
    browserContent: params.browserContent || '',
    devicePrint: params.devicePrint || '',
    sdkVersion: params.sdkVersion || '',
    ctftype: params.ctftype || '',
    ctfno: params.ctfno || '',
    ctfname: params.ctfname || '',
    customerId: params.customerId || '',
    orgCode: params.orgCode
  };

  // 调用POST接口（注意替换<host>:<port>为实际服务地址）
  return http(
    '/video/reserve/certification/initialize',
    requestParams
  );
}

/**
 * 视频活体认证接口
 * 用于视频活体的视频认证操作
 * @param {Object} params - 请求参数
 * @param {string} params.sessionId - 会话ID（必需）
 * @param {string} params.tradingFlowNO - 交易流水号（32位，必需）
 * @param {string} params.channel - 渠道编码（32位，必需）
 * @param {string} params.tradingCode - 交易编码（10位，必需）
 * @param {string} params.video - 视频数据(base64编码，必需)
 * @param {string} [params.thresholds] - 策略等级，默认使用medium.txt
 * @param {number} [params.filterType] - 图片质量过滤掩码
 * @param {string} params.sceneNo - 场景编码（1-32位，必需）
 * @param {number} [params.lightStartTime] - 炫彩开始时间(0-10)
 * @param {number} [params.lightEndTime] - 炫彩结束时间(0-10)
 * @param {number} params.videoRate - 帧率(1-4，必需，默认25)
 * @param {string} [params.deviceType] - 设备型号
 * @param {string} [params.devicePrint] - 设备指纹
 * @param {string} [params.sdkVersion] - SDK版本
 * @param {string} [params.ctftype] - 证件类型
 * @param {string} [params.ctfno] - 证件号码
 * @param {string} [params.ctfname] - 证件名称
 * @param {string} [params.customerId] - 客户ID
 * @param {string} params.orgCode - 组织编码（必需）
 * @param {number} [params.sdkErroFlag] - SDK前端故障标识(0-无 1-有)
 * @param {Object} [params.sdkErroObject] - SDK前端故障详情对象
 * @param {string} [params.sdkErroObject.code] - 错误编码
 * @param {string} [params.sdkErroObject.message] - 错误信息
 * @returns {Promise} - 返回接口响应Promise
 * @throws {Error} 当缺少必需参数时抛出错误
 */
export function handleVideoLivenessCertification(params) {
  // 验证必需参数
  const requiredParams = ['sessionId', 'tradingFlowNO', 'channel', 'tradingCode', 'video', 'sceneNo', 'videoRate', 'orgCode'];
  const missingParams = requiredParams.filter(param => !params[param]);
  if (missingParams.length > 0) {
    return Promise.reject(new Error(`缺少必需参数: ${missingParams.join(', ')}`));
  }

  // 构造请求参数（过滤undefined值并设置默认值）
  const requestParams = {
    sessionId: params.sessionId,
    tradingFlowNO: params.tradingFlowNO,
    channel: params.channel,
    tradingCode: params.tradingCode,
    video: params.video,
    thresholds: params.thresholds || 'medium.txt',
    filterType: params.filterType || 0,
    sceneNo: params.sceneNo,
    lightStartTime: params.lightStartTime || 0,
    lightEndTime: params.lightEndTime || 0,
    videoRate: params.videoRate || 25,
    deviceType: params.deviceType || '',
    devicePrint: params.devicePrint || '',
    sdkVersion: params.sdkVersion || '',
    ctftype: params.ctftype || '',
    ctfno: params.ctfno || '',
    ctfname: params.ctfname || '',
    customerId: params.customerId || '',
    orgCode: params.orgCode,
    sdkErroFlag: params.sdkErroFlag || 0,
    sdkErroObject: params.sdkErroObject || {}
  };

  // 调用POST接口
  return http(
    '/video/reserve/certification/handle',
    requestParams
  );
}