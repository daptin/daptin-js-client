import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";
import {AxiosInstance} from "axios";

/**
 * AggregationClient - A client for making aggregation requests to Daptin backend
 */
class AggregationClient {
    private appConfig: AppConfig;
    private request: {
        RootEntity: string;
        Join: any[];
        GroupBy: any[];
        ProjectColumn: any[];
        Query: any[];
        Order: any[];
        Having: any[];
        Filter: any[];
        TimeSample: string;
        TimeFrom: string;
        TimeTo: string
    };
    private tokenGetter: TokenGetter;
    private axiosInstance: AxiosInstance;
    /**
     * Create a new aggregation client
     * @param appConfig
     * @param tokenGetter
     * @param axiosInstance
     */
    constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
        this.appConfig = appConfig;
        this.tokenGetter = tokenGetter;
        this.axiosInstance = axiosInstance;
        this._resetRequest();
    }

    /**
     * Reset the current request to its initial state
     * @private
     */
    _resetRequest() {
        this.request = {
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
        };
    }

    /**
     * Set the root entity for the aggregation
     * @param {string} entityName - The name of the entity to query
     * @returns {AggregationClient} - Returns this client for chaining
     */
    entity(entityName) {
        this.request.RootEntity = entityName;
        return this;
    }

    /**
     * Add a join to the aggregation
     * @param {string} tableName - The name of the table to join
     * @param {string|Array<string>} conditions - Join conditions in the format "column eq value" or "column1 eq column2@table"
     * @returns {AggregationClient} - Returns this client for chaining
     */
    join(tableName, conditions) {
        if (!Array.isArray(conditions)) {
            conditions = [conditions];
        }

        const joinString = `${tableName}@${conditions.join('&')}`;
        this.request.Join.push(joinString);
        return this;
    }

    /**
     * Add grouping columns to the aggregation
     * @param {...string} columns - Columns to group by
     * @returns {AggregationClient} - Returns this client for chaining
     */
    groupBy(...columns) {
        this.request.GroupBy.push(...columns);
        return this;
    }

    /**
     * Add projection columns to the aggregation
     * @param {...string} columns - Columns to project (can include aggregation functions like "count(*)", "sum(amount)", etc.)
     * @returns {AggregationClient} - Returns this client for chaining
     */
    project(...columns) {
        this.request.ProjectColumn.push(...columns);
        return this;
    }

    /**
     * Add count to the projection
     * @returns {AggregationClient} - Returns this client for chaining
     */
    count() {
        this.request.ProjectColumn.push("count");
        return this;
    }

    /**
     * Add sum aggregation to the projection
     * @param {string} column - Column to sum
     * @returns {AggregationClient} - Returns this client for chaining
     */
    sum(column) {
        this.request.ProjectColumn.push(`sum(${column})`);
        return this;
    }

    /**
     * Add average aggregation to the projection
     * @param {string} column - Column to average
     * @returns {AggregationClient} - Returns this client for chaining
     */
    avg(column) {
        this.request.ProjectColumn.push(`avg(${column})`);
        return this;
    }

    /**
     * Add min aggregation to the projection
     * @param {string} column - Column to find minimum value
     * @returns {AggregationClient} - Returns this client for chaining
     */
    min(column) {
        this.request.ProjectColumn.push(`min(${column})`);
        return this;
    }

    /**
     * Add max aggregation to the projection
     * @param {string} column - Column to find maximum value
     * @returns {AggregationClient} - Returns this client for chaining
     */
    max(column) {
        this.request.ProjectColumn.push(`max(${column})`);
        return this;
    }

    /**
     * Add filter conditions
     * @param {string} column - Column name to filter on
     * @param {string} operator - Operator (eq, lt, gt, lte, gte, in, notin, is, not)
     * @param {string|number|boolean} value - Value to compare against
     * @returns {AggregationClient} - Returns this client for chaining
     */
    filter(column, operator, value) {
        let valueStr = value;

        // Handle references
        if (typeof value === 'object' && value !== null && value.entity && value.id) {
            valueStr = `${value.entity}@${value.id}`;
        }

        // Handle special values
        if (value === null) {
            valueStr = 'null';
        } else if (value === true) {
            valueStr = 'true';
        } else if (value === false) {
            valueStr = 'false';
        }

        this.request.Filter.push(`${operator}(${column},${valueStr})`);
        return this;
    }

    /**
     * Add equals filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    eq(column, value) {
        return this.filter(column, '=', value);
    }

    /**
     * Add not equals filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    neq(column, value) {
        return this.filter(column, 'not', value);
    }

    /**
     * Add less than filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    lt(column, value) {
        return this.filter(column, 'lt', value);
    }

    /**
     * Add less than or equal filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    lte(column, value) {
        return this.filter(column, 'lte', value);
    }

    /**
     * Add greater than filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    gt(column, value) {
        return this.filter(column, 'gt', value);
    }

    /**
     * Add greater than or equal filter
     * @param {string} column - Column name
     * @param {*} value - Value to compare
     * @returns {AggregationClient} - Returns this client for chaining
     */
    gte(column, value) {
        return this.filter(column, 'gte', value);
    }

    /**
     * Add in filter (value in list)
     * @param {string} column - Column name
     * @param {Array} values - Values to check against
     * @returns {AggregationClient} - Returns this client for chaining
     */
    in(column, values) {
        return this.filter(column, 'in', values.join(','));
    }

    /**
     * Add not in filter (value not in list)
     * @param {string} column - Column name
     * @param {Array} values - Values to check against
     * @returns {AggregationClient} - Returns this client for chaining
     */
    notIn(column, values) {
        return this.filter(column, 'notin', values.join(','));
    }

    /**
     * Add is null filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isNull(column) {
        return this.filter(column, 'is', 'null');
    }

    /**
     * Add is not null filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isNotNull(column) {
        return this.filter(column, 'not', 'null');
    }

    /**
     * Add is true filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isTrue(column) {
        return this.filter(column, 'is', 'true');
    }

    /**
     * Add is not true filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isNotTrue(column) {
        return this.filter(column, 'not', 'true');
    }

    /**
     * Add is false filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isFalse(column) {
        return this.filter(column, 'is', 'false');
    }

    /**
     * Add is not false filter
     * @param {string} column - Column name
     * @returns {AggregationClient} - Returns this client for chaining
     */
    isNotFalse(column) {
        return this.filter(column, 'not', 'false');
    }

    /**
     * Add having conditions for filtering aggregate results
     * @param {string} aggregateExpr - Aggregate expression (e.g., "count(*)", "sum(amount)")
     * @param {string} operator - Operator (eq, lt, gt, lte, gte)
     * @param {*} value - Value to compare against
     * @returns {AggregationClient} - Returns this client for chaining
     */
    having(aggregateExpr, operator, value) {
        this.request.Having.push(`${operator}(${aggregateExpr},${value})`);
        return this;
    }

    /**
     * Add order by clause
     * @param {...string} columns - Columns to order by (prefix with '-' for descending order)
     * @returns {AggregationClient} - Returns this client for chaining
     */
    orderBy(...columns) {
        this.request.Order.push(...columns);
        return this;
    }

    /**
     * Set time sample format (for time series data)
     * @param {string} format - Time sample format
     * @returns {AggregationClient} - Returns this client for chaining
     */
    timeSample(format) {
        this.request.TimeSample = format;
        return this;
    }

    /**
     * Set time range from
     * @param {string} timeFrom - Start time
     * @returns {AggregationClient} - Returns this client for chaining
     */
    timeFrom(timeFrom) {
        this.request.TimeFrom = timeFrom;
        return this;
    }

    /**
     * Set time range to
     * @param {string} timeTo - End time
     * @returns {AggregationClient} - Returns this client for chaining
     */
    timeTo(timeTo) {
        this.request.TimeTo = timeTo;
        return this;
    }

    /**
     * Execute the aggregation request
     * @param {Object} options - Additional options for the request
     * @param {boolean} options.rawResponse - If true, returns the raw response instead of just the data
     * @returns {Promise<Object>} - Promise resolving to the aggregation results
     */
    async execute(options = {
        rawResponse: false
    }) {
        if (!this.request.RootEntity) {
            throw new Error("Root entity must be specified");
        }

        const endpoint = `${this.appConfig.endpoint}/aggregate/${this.request.RootEntity}`;

        try {
            const token = this.tokenGetter.getToken();
            let requestHeaders = {
                'Content-Type': 'application/json'
            };
            if (token && token.length > 1) {
                requestHeaders["Authorization"] = "Bearer " + token;
            }
            const response = await this.axiosInstance({
                url: endpoint,
                method: 'POST',
                headers: requestHeaders,
                data: this.request
            });

            // Reset the request for next use
            const currentRequest = this.request;
            this._resetRequest();

            if (options.rawResponse) {
                return {
                    data: response.data.data,
                    request: currentRequest
                };
            }

            return response.data.data;
        } catch (error) {
            this._resetRequest();
            throw error;
        }
    }

    /**
     * Create a reference object for use in filters
     * @param {string} entity - Entity name
     * @param {string} id - Entity ID (UUID)
     * @returns {Object} - Reference object
     */
    static ref(entity, id) {
        return { entity, id };
    }
}

export default AggregationClient;
