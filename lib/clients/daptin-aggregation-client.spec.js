// daptin-aggregation-client.test.js

// Mock fetch globally
global.fetch = jest.fn();

import AggregationClient from "./aggregate_client"

describe('AggregationClient', () => {
  let client;
  const baseUrl = 'http://localhost:6336';

  beforeEach(() => {
    // Create a mock AppConfig, TokenGetter, and AxiosInstance
    const mockAppConfig = { endpoint: baseUrl };
    const mockTokenGetter = { getToken: jest.fn().mockResolvedValue('mock-token') };
    const mockAxiosInstance = {
      post: jest.fn().mockResolvedValue({
        data: {
          data: [
            {
              type: 'aggregate_test',
              id: '123',
              attributes: { count: 10 }
            }
          ]
        }
      })
    };

    client = new AggregationClient(mockAppConfig, mockTokenGetter, mockAxiosInstance);
    fetch.mockClear();

    // Default mock response
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              type: 'aggregate_test',
              id: '123',
              attributes: { count: 10 }
            }
          ]
        }),
        text: () => Promise.resolve('')
      })
    );
  });

  describe('constructor', () => {
    test('should initialize with baseUrl', () => {
      expect(client.appConfig.endpoint).toBe(baseUrl);
    });

    test('should initialize empty request object', () => {
      expect(client.request).toEqual({
        RootEntity: '',
        Join: [],
        GroupBy: [],
        ProjectColumn: [],
        Query: [],
        Order: [],
        Having: [],
        Filter: [],
        TimeSample: '',
        TimeFrom: '',
        TimeTo: ''
      });
    });
  });

  describe('entity', () => {
    test('should set root entity', () => {
      client.entity('users');
      expect(client.request.RootEntity).toBe('users');
    });

    test('should be chainable', () => {
      const result = client.entity('users');
      expect(result).toBe(client);
    });
  });

  describe('join', () => {
    test('should add join with single condition', () => {
      client.join('profile', 'user_id eq users.id');
      expect(client.request.Join).toEqual(['profile@user_id eq users.id']);
    });

    test('should add join with multiple conditions', () => {
      client.join('profile', ['user_id eq users.id', 'status eq "active"']);
      expect(client.request.Join).toEqual(['profile@user_id eq users.id&status eq "active"']);
    });
  });

  describe('groupBy', () => {
    test('should add single groupBy column', () => {
      client.groupBy('region');
      expect(client.request.GroupBy).toEqual(['region']);
    });

    test('should add multiple groupBy columns', () => {
      client.groupBy('region', 'country');
      expect(client.request.GroupBy).toEqual(['region', 'country']);
    });
  });

  describe('projections', () => {
    test('should add project columns', () => {
      client.project('name', 'email');
      expect(client.request.ProjectColumn).toEqual(['name', 'email']);
    });

    test('should add count', () => {
      client.count();
      expect(client.request.ProjectColumn).toEqual(['count']);
    });

    test('should add sum', () => {
      client.sum('amount');
      expect(client.request.ProjectColumn).toEqual(['sum(amount)']);
    });

    test('should add avg', () => {
      client.avg('price');
      expect(client.request.ProjectColumn).toEqual(['avg(price)']);
    });

    test('should add min', () => {
      client.min('price');
      expect(client.request.ProjectColumn).toEqual(['min(price)']);
    });

    test('should add max', () => {
      client.max('price');
      expect(client.request.ProjectColumn).toEqual(['max(price)']);
    });
  });

  describe('filter methods', () => {
    test('should add equals filter', () => {
      client.eq('status', 'active');
      expect(client.request.Filter).toEqual(['=(status,active)']);
    });

    test('should add not equals filter', () => {
      client.neq('status', 'inactive');
      expect(client.request.Filter).toEqual(['not(status,inactive)']);
    });

    test('should add less than filter', () => {
      client.lt('amount', 100);
      expect(client.request.Filter).toEqual(['lt(amount,100)']);
    });

    test('should add less than or equal filter', () => {
      client.lte('amount', 100);
      expect(client.request.Filter).toEqual(['lte(amount,100)']);
    });

    test('should add greater than filter', () => {
      client.gt('amount', 100);
      expect(client.request.Filter).toEqual(['gt(amount,100)']);
    });

    test('should add greater than or equal filter', () => {
      client.gte('amount', 100);
      expect(client.request.Filter).toEqual(['gte(amount,100)']);
    });

    test('should add in filter', () => {
      client.in('status', ['active', 'pending']);
      expect(client.request.Filter).toEqual(['in(status,active,pending)']);
    });

    test('should add not in filter', () => {
      client.notIn('status', ['cancelled', 'failed']);
      expect(client.request.Filter).toEqual(['notin(status,cancelled,failed)']);
    });

    test('should add is null filter', () => {
      client.isNull('deleted_at');
      expect(client.request.Filter).toEqual(['is(deleted_at,null)']);
    });

    test('should add is not null filter', () => {
      client.isNotNull('created_at');
      expect(client.request.Filter).toEqual(['not(created_at,null)']);
    });

    test('should add is true filter', () => {
      client.isTrue('active');
      expect(client.request.Filter).toEqual(['is(active,true)']);
    });

    test('should add is not true filter', () => {
      client.isNotTrue('deleted');
      expect(client.request.Filter).toEqual(['not(deleted,true)']);
    });

    test('should add is false filter', () => {
      client.isFalse('deleted');
      expect(client.request.Filter).toEqual(['is(deleted,false)']);
    });

    test('should add is not false filter', () => {
      client.isNotFalse('active');
      expect(client.request.Filter).toEqual(['not(active,false)']);
    });

    test('should handle entity references in filters', () => {
      const ref = AggregationClient.ref('user', '550e8400-e29b-41d4-a716-446655440000');
      client.eq('user_id', ref);
      expect(client.request.Filter).toEqual(['=(user_id,user@550e8400-e29b-41d4-a716-446655440000)']);
    });
  });

  describe('having', () => {
    test('should add having clause', () => {
      client.having('count(*)', 'gt', 10);
      expect(client.request.Having).toEqual(['gt(count(*),10)']);
    });

    test('should add having clause with aggregate function', () => {
      client.having('sum(amount)', 'gte', 1000);
      expect(client.request.Having).toEqual(['gte(sum(amount),1000)']);
    });
  });

  describe('orderBy', () => {
    test('should add ascending order', () => {
      client.orderBy('name');
      expect(client.request.Order).toEqual(['name']);
    });

    test('should add descending order', () => {
      client.orderBy('-name');
      expect(client.request.Order).toEqual(['-name']);
    });

    test('should add multiple orders', () => {
      client.orderBy('country', '-created_at');
      expect(client.request.Order).toEqual(['country', '-created_at']);
    });
  });

  describe('time methods', () => {
    test('should set time sample', () => {
      client.timeSample('day');
      expect(client.request.TimeSample).toBe('day');
    });

    test('should set time from', () => {
      client.timeFrom('2023-01-01');
      expect(client.request.TimeFrom).toBe('2023-01-01');
    });

    test('should set time to', () => {
      client.timeTo('2023-12-31');
      expect(client.request.TimeTo).toBe('2023-12-31');
    });
  });

  describe('execute', () => {
    test('should throw error if RootEntity not set', async () => {
      await expect(client.execute()).rejects.toThrow('Root entity must be specified');
    });

    test('should build correct request', async () => {
      await client
        .entity('users')
        .groupBy('country')
        .count()
        .eq('status', 'active')
        .orderBy('-count')
        .execute();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/aggregate/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          RootEntity: 'users',
          Join: [],
          GroupBy: ['country'],
          ProjectColumn: ['count'],
          Query: [],
          Order: ['-count'],
          Having: [],
          Filter: ['=(status,active)'],
          TimeSample: '',
          TimeFrom: '',
          TimeTo: ''
        })
      });
    });

    test('should return data field by default', async () => {
      const result = await client
        .entity('users')
        .count()
        .execute();

      expect(result).toEqual([
        {
          type: 'aggregate_test',
          id: '123',
          attributes: { count: 10 }
        }
      ]);
    });

    test('should return raw response when rawResponse option is true', async () => {
      const result = await client
        .entity('users')
        .count()
        .execute({ rawResponse: true });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('request');
      expect(result.data).toEqual([
        {
          type: 'aggregate_test',
          id: '123',
          attributes: { count: 10 }
        }
      ]);
    });

    test('should handle API errors', async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('Invalid filter expression')
        })
      );

      await expect(
        client
          .entity('users')
          .count()
          .execute()
      ).rejects.toThrow('Aggregation request failed: 400 Bad Request - Invalid filter expression');
    });

    test('should reset request after execution', async () => {
      await client
        .entity('users')
        .count()
        .execute();

      expect(client.request).toEqual({
        RootEntity: '',
        Join: [],
        GroupBy: [],
        ProjectColumn: [],
        Query: [],
        Order: [],
        Having: [],
        Filter: [],
        TimeSample: '',
        TimeFrom: '',
        TimeTo: ''
      });
    });

    test('should reset request even if execution fails', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      await expect(
        client
          .entity('users')
          .count()
          .execute()
      ).rejects.toThrow('Network error');

      expect(client.request).toEqual({
        RootEntity: '',
        Join: [],
        GroupBy: [],
        ProjectColumn: [],
        Query: [],
        Order: [],
        Having: [],
        Filter: [],
        TimeSample: '',
        TimeFrom: '',
        TimeTo: ''
      });
    });
  });

  describe('complex queries', () => {
    test('should build complex query correctly', async () => {
      await client
        .entity('orders')
        .join('users', 'orders.user_id eq users.id')
        .join('products', ['orders.product_id eq products.id', 'products.active eq "true"'])
        .groupBy('users.country', 'products.category')
        .sum('orders.amount')
        .count()
        .gt('orders.amount', 100)
        .isNotNull('orders.shipped_date')
        .having('sum(orders.amount)', 'gt', 1000)
        .orderBy('-sum(orders.amount)')
        .timeFrom('2023-01-01')
        .timeTo('2023-12-31')
        .execute();

      expect(fetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);

      expect(requestBody).toEqual({
        RootEntity: 'orders',
        Join: [
          'users@orders.user_id eq users.id',
          'products@orders.product_id eq products.id&products.active eq "true"'
        ],
        GroupBy: ['users.country', 'products.category'],
        ProjectColumn: ['sum(orders.amount)', 'count'],
        Query: [],
        Order: ['-sum(orders.amount)'],
        Having: ['gt(sum(orders.amount),1000)'],
        Filter: [
          'gt(orders.amount,100)',
          'not(orders.shipped_date,null)'
        ],
        TimeSample: '',
        TimeFrom: '2023-01-01',
        TimeTo: '2023-12-31'
      });
    });
  });

  describe('static methods', () => {
    test('ref should create entity reference object', () => {
      const ref = AggregationClient.ref('user', '123');
      expect(ref).toEqual({ entity: 'user', id: '123' });
    });
  });
});
