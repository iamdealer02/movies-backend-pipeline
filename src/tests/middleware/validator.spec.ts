import { validator } from '../../middleware/validator';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { CustomRequest } from '../../interfaces/validator.interface';
import logger from '../../middleware/winston';

jest.mock('../../middleware/winston', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  };
});

describe('validator middleware', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() if request body is valid', () => {
    const req = getMockReq<CustomRequest>({
      body: {
        name: 'test',
      },
    });

    const { res, next } = getMockRes();
    validator(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should delete creation_date from request body if present', () => {
    const req = getMockReq<CustomRequest>({
      body: {
        creation_date: '2021-09-01',
        name: 'test',
      },
    });

    const { res, next } = getMockRes();
    validator(req, res, next);

    expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
    expect(next).toHaveBeenCalled();
  });

  it('should set creation_date to current date if not present', () => {
    const req = getMockReq<CustomRequest>({
      body: {
        name: 'test',
      },
    });

    const { res, next } = getMockRes();
    validator(req, res, next);

    expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
    expect(next).toHaveBeenCalled();
  });

  it('should set empty string values to null', () => {
    const req = getMockReq<CustomRequest>({
      body: {
        name: '',
      },
    });

    const { res, next } = getMockRes();
    validator(req, res, next);

    expect(req.body.name).toBe(null);
    expect(next).toHaveBeenCalled();
  });

  it('should log error and send response if an error occurs', () => {
    const req = getMockReq<CustomRequest>({
      body: {
        name: 'test',
      },
    });

    const { res, next } = getMockRes();
    jest.spyOn(Object, 'entries').mockImplementationOnce(() => {
      throw new Error('test error');
    });

    validator(req, res, next);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'test error' });
  });
});
