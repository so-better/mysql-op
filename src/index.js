/**
 * 基于mysql+nodejs+express的数据库操作工具
 */
class SqlUtil {
	constructor(pool, table) {
		this.pool = pool //连接池
		this.table = table //数据库表名
	}

	/**
	 * 向数据库表插入数据
	 * @param {Object} entity
	 */
	insert(entity) {
		return new Promise((resolve, reject) => {
			let param = ''
			let params = []
			for (let key in entity) {
				param += '?,'
				params.push(entity[key])
			}
			param = param.substring(0, param.length - 1)
			let sql = 'insert into ' + this.table + ' values (' + param + ')'
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * 修改数据库表数据
	 * @param {Object} entity 表对象
	 * @param {Object} column 表字段名称(以此字段为依据修改)
	 */
	update(entity, column) {
		return new Promise((resolve, reject) => {
			let param = ''
			let params = []
			let conidtion = null
			for (let key in entity) {
				if (key === column) {
					conidtion = key
				} else {
					param += key + '=?,'
					params.push(entity[key])
				}
			}
			param = param.substring(0, param.length - 1)
			if (conidtion) {
				param += ' where ' + conidtion + '=?'
				params.push(entity[conidtion])
			}
			let sql = 'update ' + this.table + ' set ' + param
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * 删除数据库表数据
	 * @param column 表字段名称(以此字段为依据删除)
	 * @param columnValue 表字段名称对应的值
	 */
	delete(column, columnValue) {
		return new Promise((resolve, reject) => {
			let sql = 'delete from ' + this.table + ' where ' + column + '=?'
			let params = [columnValue]
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**单条件查询
	 * @param {Object} column 表字段名称(以此字段查询)
	 * @param {Object} columnValue 表字段名称对应的值
	 * @param {Object} columns 指定查询部分字段数组
	 * @param {Object} associatedTables 关联查询的表数组，包含表名和关联字段
	 * @param {Object} joinType 关联查询类型：left/inner/right
	 */
	query(column, columnValue, columns = [], associatedTables = [], joinType = 'inner') {
		return new Promise((resolve, reject) => {
			let str = ''
			if (columns instanceof Array && columns.length > 0) {
				for (let i = 0; i < columns.length; i++) {
					str += ',' + columns[i]
				}
				str = str.substring(1)
			} else {
				str = '*'
			}
			let sql = `select ${str} from ${this.table}`
			let params = []
			//如果是关联查询
			if (associatedTables instanceof Array && associatedTables.length > 0) {
				associatedTables.forEach(associatedTable => {
					sql += ` ${joinType} join ${associatedTable.table} on ${associatedTable.columns[1]}=${associatedTable.columns[0]}`
				})
				sql += ` where ${column}=?`
			} else {
				sql += ` where ${column}=?`
			}
			params = [columnValue]
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * 多条件查询
	 * @param {Object} queryOptions 字段参数对象
	 * @param {Object} sortBy 排序依据,即根据什么字段进行排序,此处值为排序依据的字段名称字符串
	 * @param {Object} sortMethod 排序方法,即是升序还是降序，升序为"asc",降序为"desc"
	 * @param {Object} startIndex  分页数据起始序列
	 * @param {Object} pageSize 分页大小
	 * @param {Object} conjuction 连接词'and'或者'or'
	 * @param {Object} columns 指定查询部分字段数组
	 * @param {Object} associatedTables 关联查询的表数组，包含表名和关联字段
	 * @param {Object} joinType 关联查询类型：left/inner/right
	 */
	querys(queryOptions = {}, conjuction = 'and', sortBy, sortMethod, startIndex, pageSize, columns = [], associatedTables = [], joinType = 'inner') {
		return new Promise((resolve, reject) => {
			let str = ''
			if (columns instanceof Array && columns.length > 0) {
				for (let i = 0; i < columns.length; i++) {
					str += ',' + columns[i]
				}
				str = str.substring(1)
			} else {
				str = '*'
			}
			let sql = `select ${str} from ${this.table}`
			//如果关联查询
			if (associatedTables instanceof Array && associatedTables.length > 0) {
				associatedTables.forEach(associatedTable => {
					sql += ` ${joinType} join ${associatedTable.table} on ${associatedTable.columns[1]}=${associatedTable.columns[0]}`
				})
			}
			//获取字段参数对象数组
			let queryOptionsArray = Object.keys(queryOptions)
			if (queryOptionsArray.length > 0) {
				sql += ' where '
			}
			let params = []
			queryOptionsArray.forEach((key, index) => {
				let qb = {}
				//对象形式，则可能进行模糊查询或者范围查询
				if (typeof queryOptions[key] == 'object' && Object.prototype.toString.call(queryOptions[key]).toLocaleLowerCase() === '[object object]' && !queryOptions[key].length) {
					qb.value = queryOptions[key].value
					if (typeof queryOptions[key].fuzzy == 'boolean') {
						qb.fuzzy = queryOptions[key].fuzzy
					} else {
						qb.fuzzy = false
					}
					if (typeof queryOptions[key].equal == 'boolean') {
						qb.equal = queryOptions[key].equal
					} else {
						qb.equal = false
					}
				}
				//非对象形式，即直接根据字段-字段值进行查询
				else {
					qb.value = queryOptions[key]
					//默认非模糊查询
					qb.fuzzy = false
					//默认范围查询时不包含等号
					qb.equal = false
				}

				//如果value值为数组，表示范围查询
				if (qb.value instanceof Array) {
					if (qb.value[0] != null && qb.value[1] != null && qb.value[0] != undefined && qb.value[1] != undefined) {
						if (qb.value[0] <= qb.value[1]) {
							if (qb.equal) {
								sql += `(${key}>=? and ${key}<=?) ${conjuction} `
							} else {
								sql += `(${key}>? and ${key}<?) ${conjuction} `
							}
						} else {
							if (qb.equal) {
								sql += `(${key}>=? or ${key}<=?) ${conjuction} `
							} else {
								sql += `(${key}>? or ${key}<?) ${conjuction} `
							}
						}
						params.push(qb.value[0])
						params.push(qb.value[1])
					} else if (qb.value[0] != null && qb.value[0] != undefined) {
						if (qb.equal) {
							sql += `${key}>=? ${conjuction} `
						} else {
							sql += `${key}>? ${conjuction} `
						}
						params.push(qb.value[0])
					} else if (qb.value[1] != null && qb.value[1] != undefined) {
						if (qb.equal) {
							sql += `${key}<=? ${conjuction} `
						} else {
							sql += `${key}<? ${conjuction} `
						}
						params.push(qb.value[1])
					}
				} else {
					//开启模糊查询
					if (qb.fuzzy) {
						sql += `locate(?,${key})>0 ${conjuction} `
					} else {
						sql += `${key}=? ${conjuction} `
					}
					params.push(qb.value)
				}
				if (index == queryOptionsArray.length - 1) {
					sql = sql.substring(0, sql.lastIndexOf(conjuction))
				}
			})
			if (sortBy && sortMethod) {
				sql += ` order by ${sortBy} ${sortMethod} `
			}
			if (typeof startIndex == 'number' && typeof pageSize == 'number' && !isNaN(startIndex) && !isNaN(pageSize)) {
				sql += ` limit ?,? `
				params.push(startIndex)
				params.push(pageSize)
			}
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * 多条件查询的总记录数
	 * @param {Object} queryOptions 字段参数对象
	 * @param {Object} conjuction 连接词，取值and或者or
	 * @param {Object} associatedTables 关联查询的表数组，包含表名和关联字段
	 * @param {Object} joinType 关联查询类型：left/inner/right
	 */
	queryCounts(queryOptions = {}, conjuction = 'and', associatedTables = [], joinType = 'inner') {
		return new Promise((resolve, reject) => {
			let sql = `select count(1) from ${this.table}`
			//如果关联查询
			if (associatedTables instanceof Array && associatedTables.length > 0) {
				associatedTables.forEach(associatedTable => {
					sql += ` ${joinType} join ${associatedTable.table} on ${associatedTable.columns[1]}=${associatedTable.columns[0]}`
				})
			}
			//获取字段参数对象数组
			let queryOptionsArray = Object.keys(queryOptions)
			if (queryOptionsArray.length > 0) {
				sql += ' where '
			}
			let params = []
			queryOptionsArray.forEach(function (key, index) {
				let qb = {}
				//对象形式，则可能进行模糊查询或者范围查询
				if (typeof queryOptions[key] == 'object' && Object.prototype.toString.call(queryOptions[key]).toLocaleLowerCase() === '[object object]' && !queryOptions[key].length) {
					qb.value = queryOptions[key].value
					if (typeof queryOptions[key].fuzzy == 'boolean') {
						qb.fuzzy = queryOptions[key].fuzzy
					} else {
						qb.fuzzy = false
					}
					if (typeof queryOptions[key].equal == 'boolean') {
						qb.equal = queryOptions[key].equal
					} else {
						qb.equal = false
					}
				}
				//非对象形式，即直接根据字段-字段值进行查询
				else {
					qb.value = queryOptions[key]
					//默认非模糊查询
					qb.fuzzy = false
					//默认范围查询时不包含等号
					qb.equal = false
				}
				//如果value值为数组，表示范围查询
				if (qb.value instanceof Array) {
					if (qb.value[0] != null && qb.value[1] != null && qb.value[0] != undefined && qb.value[1] != undefined) {
						if (qb.value[0] <= qb.value[1]) {
							if (qb.equal) {
								sql += `(${key}>=? and ${key}<=?) ${conjuction} `
							} else {
								sql += `(${key}>? and ${key}<?) ${conjuction} `
							}
						} else {
							if (qb.equal) {
								sql += `(${key}>=? or ${key}<=?) ${conjuction} `
							} else {
								sql += `(${key}>? or ${key}<?) ${conjuction} `
							}
						}
						params.push(qb.value[0])
						params.push(qb.value[1])
					} else if (qb.value[0] != null && qb.value[0] != undefined) {
						if (qb.equal) {
							sql += `${key}>=? ${conjuction} `
						} else {
							sql += `${key}>? ${conjuction} `
						}
						params.push(qb.value[0])
					} else if (qb.value[1] != null && qb.value[1] != undefined) {
						if (qb.equal) {
							sql += `${key}<=? ${conjuction} `
						} else {
							sql += `${key}<? ${conjuction} `
						}
						params.push(qb.value[1])
					}
				} else {
					//开启模糊查询
					if (qb.fuzzy) {
						sql += `locate(?,${key})>0 ${conjuction} `
					} else {
						sql += `${key}=? ${conjuction} `
					}
					params.push(qb.value)
				}
				if (index == queryOptionsArray.length - 1) {
					sql = sql.substring(0, sql.lastIndexOf(conjuction))
				}
			})
			this.pool.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result[0]['count(1)'])
				}
			})
		})
	}
}

module.exports = SqlUtil
