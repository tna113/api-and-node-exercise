var express = require("express");
//var moment = require("moment");
//moment.format();

var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("ta7384");

// const BusinessLayer = require('./business');
// const bl = new BusinessLayer("ta7384");
// bl.test();

const urlencodeParser = express.urlencoded({ extended: false });
var app = express();

var logger = require('morgan');
app.use(logger('dev'));
app.use(express.json());

const PATH = "/CompanyServices";

function makeUnique(val1, val2) {
    return "" + val1 + "_" + val2;
}

function isDateValid(dateStr) {
    console.log(`date ${dateStr} valid?`);
    const date = new Date(dateStr);
    const day = parseInt(date.getDay());
    dateValid = true;

    if (day==0 || day==6) {
        dateValid = false;
    }

    console.log('date invalid');
    return dateValid;
}

function areTimecardDatesValid(start_date, end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const now = new Date();
    isValid = true;

    //start and end cant be on weekend
    const start_day = start.getDay();
    const end_day = end.getDay();
    if (start_day==0 || start_day==6) {
        console.log("start date cannot be on a weekend");
        isValid = false;
    }
    if (end_day==0 || end_day==6) {
        console.log("end date cannot be on a weekend");
        isValid = false;
    }

    //start and end times has to be between 8:00 - 18:00
    if (start.getHours() < 8 || start.getHours() > 18) {
        console.log("start time has to be between 08:00 and 18:00");
        isValid = false;
    }
    if (end.getHours() < 8 || end.getHours() > 18) {
        console.log("end time has to be between 08:00 and 18:00");
        isValid = false;
    }

    //start >= current date
    if (start < now) {
        console.log("start date cannot be in the past");
        isValid = false;
    }

    //end >= start + 1hr && same date
    end_hour = end.getHours();
    start_hour = start.getHours();
    if((end_hour-start_hour)<1) {
        console.log("end time must be at least 1 hour after start time");
        isValid = false;
    }

    return isValid;
}

app.get("/", async (req,res) => {
    dept = new dl.Department("ta7384","deptName","deptNo","location");
    res.json({"path":PATH, "deptName":dept.getDeptName()});  
});

//█▀▀ █▀▀█ █▀▄▀█ █▀▀█ █▀▀█ █▀▀▄ █░░█ 
//█░░ █░░█ █░▀░█ █░░█ █▄▄█ █░░█ █▄▄█ 
//▀▀▀ ▀▀▀▀ ▀░░░▀ █▀▀▀ ▀░░▀ ▀░░▀ ▄▄▄█

app.delete(`${PATH}/company`, async (req, res) => {
    const comp = req.query.company;
    console.log(`$company: ${comp}`);

    query = dl.deleteCompany(comp);
    query.then(affectedRows => {
        console.log(`affectedRows: ${affectedRows}`);
        if(affectedRows>0) {
            return res.status(200).json({success:`company deleted`});
        } else {
            return res.status(400).json({
                error: `could not delete company`
            });
        }
    });
});

//█▀▀▄ █▀▀ █▀▀█ █▀▀█ █▀▀█ ▀▀█▀▀ █▀▄▀█ █▀▀ █▀▀▄ ▀▀█▀▀ 
//█░░█ █▀▀ █░░█ █▄▄█ █▄▄▀ ░░█░░ █░▀░█ █▀▀ █░░█ ░░█░░ 
//▀▀▀░ ▀▀▀ █▀▀▀ ▀░░▀ ▀░▀▀ ░░▀░░ ▀░░░▀ ▀▀▀ ▀░░▀ ░░▀░░

app.get(`${PATH}/departments`, async (req,res) => {
    const comp = req.query.company;
    query = dl.getAllDepartment(comp);
    jsonArr = [];

    query.then(deps => {
        console.log(deps);

        if(deps!=null) {
            deps.forEach(dept => {
                console.log("adding "+dept.dept_id);
                temp = {
                    dept_id: dept.dept_id,
                    company: dept.company,
                    dept_name: dept.dept_name,
                    dept_no: dept.dept_no,
                    location: dept.location
                }
                jsonArr.push(temp);
            });
    
            console.log(jsonArr);
            
            return res.status(200).json(jsonArr);
        } else {
            return res.status(404).json({
                error: "could not get departments"
            });
        }
    })
});

app.get(`${PATH}/department`, async (req,res) => {
    const comp = req.query.company;
    const id = parseInt(req.query.dept_id);
    query = dl.getDepartment(comp,id);
    jsonObj = {};
    
    query.then(dept => {
        if(dept!=null) {
            jsonObj = {
                dept_id: dept.dept_id,
                company: dept.company,
                dept_name: dept.dept_name,
                dept_no: dept.dept_no,
                location: dept.location
            }
            console.log(jsonObj);
            return res.status(200).json(jsonObj);

        } else {
            return res.status(404).json({
                error: `could not get department of id: ${id}`
            });
        }
    });

});

app.post(`${PATH}/department`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const dept_name = req.body.dept_name;
    const dept_no = req.body.dept_no;
    const unique_dept_no = makeUnique(comp,dept_no);
    const location = req.body.location;
    console.log(`comp: ${comp}, dept_name: ${dept_name}, unique_dept_no: ${unique_dept_no}, location: ${location}`);

    temp = new dl.Department(comp, dept_name, unique_dept_no, location);
    query = dl.insertDepartment(temp);
    jsonObj = {};

    query.then(dept => {
        console.log(dept);
        if(dept!=null) {
            jsonObj = {
                dept_id: dept.dept_id,
                company: dept.company,
                dept_name: dept.dept_name,
                dept_no: dept.dept_no,
                location: dept.location
            }
            console.log(jsonObj);
            return res.status(200).json({success:jsonObj});
        } else {
            return res.status(400).json({
                error: `could not insert new department`
            });
        }
    });
});

app.put(`${PATH}/department`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const dept_id = parseInt(req.body.dept_id);
    const dept_name = req.body.dept_name;
    const dept_no = req.body.dept_no;
    const unique_dept_no = makeUnique(comp,dept_no);
    const location = req.body.location;
    console.log(`comp: ${comp}, dept_id: ${dept_id}, dept_name: ${dept_name}, unique_dept_no: ${unique_dept_no}, location: ${location}`);

    //validate that dept exists
    query = dl.getDepartment(comp,dept_id);
    console.log(`getDepartment(${comp}, ${dept_id})`);

    query.then(dept => {
        console.log(dept);

        if(dept!=null) {
            //exists, delete old dep, make a new one
            rowsAffected = dl.deleteDepartment(comp, dept.dept_id);
            console.log(`dept exists, deleteDepartment(${comp}, ${dept.dept_id})`);

            temp = new dl.Department(comp, dept_name, unique_dept_no, location);
            query = dl.insertDepartment(temp);
            jsonObj = {};
        
            query.then(dept => {
                console.log(dept);
                if(dept!=null) {
                    jsonObj = {
                        dept_id: dept.dept_id,
                        company: dept.company,
                        dept_name: dept.dept_name,
                        dept_no: dept.dept_no,
                        location: dept.location
                    }
                    console.log(jsonObj);
                    return res.status(200).json({success:jsonObj});
                } else {
                    return res.status(400).json({
                        error: `could not insert new department`
                    });
                }
            });

        } else {
            return res.status(400).json({
                error: `could not delete previous record to update department`
            });
        }
    });
});

app.delete(`${PATH}/department`, async (req, res) => {
    const comp = req.query.company;
    const dept_id = req.query.dept_id;
    console.log(`$company: ${comp}, dept_id: ${dept_id}`);

    query = dl.deleteDepartment(comp, dept_id);
    query.then(affectedRows => {
        console.log(`affectedRows: ${affectedRows}`);
        if(affectedRows>0) {
            return res.status(200).json({success:`timecard deleted`});
        } else {
            return res.status(400).json({
                error: `could not delete department`
            });
        }
    });
});

//█▀▀ █▀▄▀█ █▀▀█ █░░ █▀▀█ █░░█ █▀▀ █▀▀ 
//█▀▀ █░▀░█ █░░█ █░░ █░░█ █▄▄█ █▀▀ █▀▀ 
//▀▀▀ ▀░░░▀ █▀▀▀ ▀▀▀ ▀▀▀▀ ▄▄▄█ ▀▀▀ ▀▀▀

app.get(`${PATH}/employees`, async (req,res) => {
    const comp = req.query.company;
    query = dl.getAllEmployee(comp);
    jsonArr = [];

    query.then(emps => {
        console.log(emps);

        if(emps!=null) {
            emps.forEach(emp => {
                console.log("adding "+emp.emp_id);
                temp = {
                    emp_id: emp.emp_id,
                    emp_name: emp.emp_name,
                    emp_no: emp.emp_no,
                    hire_date: emp.hire_date,
                    job: emp.job,
                    salary: emp.salary,
                    dept_id: emp.dept_id,
                    mng_id: emp.mng_id
                }
                jsonArr.push(temp);
            });
    
            console.log(jsonArr);
            
            return res.status(200).json(jsonArr);
        } else {
            return res.status(404).json({
                error: "could not get employees"
            });
        }
    })
});

app.get(`${PATH}/employee`, async (req,res) => {
    const comp = req.query.company;
    const id = parseInt(req.query.emp_id);
    query = dl.getEmployee(id);
    jsonObj = {};
    
    query.then(emp => {
        console.log(emp);

        if(emp!=null) {
            jsonObj = {
                emp_id: emp.emp_id,
                emp_name: emp.emp_name,
                emp_no: emp.emp_no,
                hire_date: emp.hire_date,
                job: emp.job,
                salary: emp.salary,
                dept_id: emp.dept_id,
                mng_id: emp.mng_id
            }
            console.log(jsonObj);
            return res.status(200).json(jsonObj);

        } else {
            return res.status(404).json({
                error: `could not get employee of id: ${id}`
            });
        }
    });

});

app.post(`${PATH}/employee`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const emp_name = req.body.emp_name;
    const emp_no = req.body.emp_no;
    const unique_emp_no = makeUnique(comp,emp_no);
    const hire_date = req.body.hire_date; //TODO: parse
    const job = req.body.job;
    const salary = Number(req.body.salary);
    const dept_id = parseInt(req.body.dept_id);
    const mng_id = parseInt(req.body.mng_id);

    console.log(`comp: ${comp}, emp_name: ${emp_name}, unique_emp_no: ${unique_emp_no}, hire_date: ${hire_date}, job: ${job}, salary: ${salary}, dept_id: ${dept_id}, mng_id: ${mng_id}`);

    //validation hire_date
    dateValid = isDateValid(hire_date);
    if(dateValid) {
        //validation department
        query = dl.getDepartment(comp,dept_id); 
        query.then((dept) => {
            if(dept!=null) {
                //validation manager
                query = dl.getEmployee(mng_id);
                query.then((mng) => {
                    if(mng!=null) {
                        temp = new dl.Employee(emp_name, emp_no, hire_date, job, salary, dept_id, mng_id);
                        query = dl.insertEmployee(temp);
                        jsonObj = {};

                        query.then(emp => {
                            console.log(emp);
                            if(emp!=null) {
                                jsonObj = {
                                    emp_id: emp.emp_id,
                                    emp_name: emp.emp_name,
                                    emp_no: emp.emp_no,
                                    hire_date: emp.hire_date,
                                    job: emp.job,
                                    salary: emp.salary,
                                    dept_id: emp.dept_id,
                                    mng_id: emp.mng_id
                                }
                                console.log(jsonObj);
                                return res.status(200).json({success:jsonObj});
                            } else {
                                return res.status(400).json({
                                    error: `could not insert new employee`
                                });
                            }
                        });
                    }
                    else {
                        return res.status(400).json({
                            error: `could not insert new employee: manager doesnt exist`
                        });
                    }
                });
            } else {
                return res.status(400).json({
                    error: `could not insert new employee: department doesnt exist`
                });
            }
        });
    } else {
        return res.status(400).json({
            error: `hire date cannot be on a weekend`
        });
    }
});

app.put(`${PATH}/employee`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const emp_id = req.body.emp_id;
    const emp_name = req.body.emp_name;
    const emp_no = req.body.emp_no;
    const unique_emp_no = makeUnique(comp,emp_no);
    const hire_date = req.body.hire_date; //TODO: parse
    const job = req.body.job;
    const salary = Number(req.body.salary);
    const dept_id = parseInt(req.body.dept_id);
    const mng_id = parseInt(req.body.mng_id);

    console.log(`comp: ${comp}, emp_id: ${emp_id}, emp_name: ${emp_name}, unique_emp_no: ${unique_emp_no}, hire_date: ${hire_date}, job: ${job}, salary: ${salary}, dept_id: ${dept_id}, mng_id: ${mng_id}`);

    //validation hire_date
    dateValid = isDateValid(hire_date);
    if(dateValid) {
        //validation department
        query = dl.getDepartment(comp,dept_id); 
        query.then((dept) => {
            if(dept!=null) {
                //validation manager
                query = dl.getEmployee(mng_id);
                query.then((mng) => {
                    if(mng!=null) {
                        //validate that manager exists
                        query = dl.getEmployee(emp_id);
                        console.log(`getEmployee(${emp_id})`);

                        query.then(emp => {
                            console.log(emp);

                            if(emp!=null) {
                                //exists, delete old employee, make a new one
                                rowsAffected = dl.deleteEmployee(emp.emp_id);
                                console.log(`emp exists, deleteEmployee(${emp.emp_id})`);

                                //new emp
                                temp = new dl.Employee(emp_name, emp_no, hire_date, job, salary, dept_id, mng_id);
                                query = dl.insertEmployee(temp);
                                jsonObj = {};

                                query.then(emp => {
                                    console.log(emp);
                                    if(emp!=null) {
                                        jsonObj = {
                                            emp_id: emp.emp_id,
                                            emp_name: emp.emp_name,
                                            emp_no: emp.emp_no,
                                            hire_date: emp.hire_date,
                                            job: emp.job,
                                            salary: emp.salary,
                                            dept_id: emp.dept_id,
                                            mng_id: emp.mng_id
                                        }
                                        console.log(jsonObj);
                                        return res.status(200).json({success:jsonObj});
                                    } else {
                                        return res.status(400).json({
                                            error: `could not update employee`
                                        });
                                    }
                                });
                            } else {
                                return res.status(400).json({
                                    error: `could not delete previous record to update employee`
                                });
                            }
                        });
                    }
                    else {
                        return res.status(400).json({
                            error: `could not insert new employee: manager doesnt exist`
                        });
                    }
                });
            } else {
                return res.status(400).json({
                    error: `could not insert new employee: department doesnt exist`
                });
            }
        });
    } else {
        return res.status(400).json({
            error: `hire date cannot be on a weekend`
        });
    }
});

app.delete(`${PATH}/employee`, async (req, res) => {
    const comp = req.query.company;
    const emp_id = parseInt(req.query.emp_id);
    console.log(`$company: ${comp}, emp_id: ${emp_id}`);

    //get and delete timecards for that employee
    query = dl.getAllTimecard(emp_id);
    query.then(tcs => {
        console.log(tcs);

        if(tcs!=null) {
            tcs.forEach(tc => {
                console.log("deleting "+tc.timecard_id);
                tc_query = dl.deleteTimecard(tc.timecard_id);

                tc_query.then(tc_affectedRows => {
                    if(tc_affectedRows>0) {
                        console.log("deleted timecard");
                    } else {
                        console.log("could not delete timecard for employee");
                    }
                })
            });

            //delete employee after deleting timecards
            employee_query = dl.deleteEmployee(emp_id);
            employee_query.then(affectedRows => {
                console.log(`affectedRows: ${affectedRows}`);
                if(affectedRows>0) {
                    return res.status(200).json({success:`employee deleted`});
                } else {
                    return res.status(400).json({
                        error: `could not delete employee`
                    });
                }
            });
        } else {
            return res.status(404).json({
                error: `could not delete timecards for emp ${id}, could not delete employee`
            });
        }
    })
});


//▀▀█▀▀ ░▀░ █▀▄▀█ █▀▀ █▀▀ █▀▀█ █▀▀█ █▀▀▄ █▀▀ 
//░░█░░ ▀█▀ █░▀░█ █▀▀ █░░ █▄▄█ █▄▄▀ █░░█ ▀▀█ 
//░░▀░░ ▀▀▀ ▀░░░▀ ▀▀▀ ▀▀▀ ▀░░▀ ▀░▀▀ ▀▀▀░ ▀▀▀

app.get(`${PATH}/timecards`, async (req,res) => {
    const comp = req.query.company;
    const id = parseInt(req.query.emp_id);
    query = dl.getAllTimecard(id);
    jsonArr = [];

    query.then(tcs => {
        console.log(tcs);

        if(tcs!=null) {
            tcs.forEach(tc => {
                console.log("adding "+tc.timecard_id);
                temp = {
                    timecard_id: tc.timecard_id,
                    start_time: tc.start_time,
                    end_time: tc.end_time,
                    emp_id: tc.emp_id
                }
                jsonArr.push(temp);
            });
    
            console.log(jsonArr);
            
            return res.status(200).json(jsonArr);
        } else {
            return res.status(404).json({
                error: `could not get timecards for emp ${id}`
            });
        }
    })
});

app.get(`${PATH}/timecard`, async (req,res) => {
    const comp = req.query.company;
    const id = parseInt(req.query.timecard_id);
    console.log(`com:${comp}, timecard_id:${id}`);
    query = dl.getTimecard(id);
    jsonObj = {};
    
    query.then(tc => {
        console.log(tc);

        if(tc!=null) {
            jsonObj = {
                timecard_id: tc.timecard_id,
                start_time: tc.start_time,
                end_time: tc.end_time,
                emp_id: tc.emp_id
            }
            console.log(jsonObj);
            return res.status(200).json({timecard:jsonObj});

        } else {
            return res.status(404).json({
                error: `could not get timecard of id: ${id}`
            });
        }
    });

});

app.post(`${PATH}/timecard`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const emp_id = parseInt(req.body.emp_id);
    const start_time = req.body.start_time;
    const end_time = req.body.end_time;
    console.log(`comp: ${comp}, emp_id: ${emp_id}, start_time: ${start_time}, end_time: ${end_time}`);

    //validation cant have another tc with same date

    //validation start/end time
    timecardDatesValid = Boolean(areTimecardDatesValid(start_time,end_time));
    console.log(`timecardDatesValid: ${timecardDatesValid}`);

    if (timecardDatesValid) {
        //validation employee must exist
        query = dl.getEmployee(emp_id);
        query.then(emp => {
            if(emp!=null) {
                temp = new dl.Timecard(start_time, end_time, emp_id);
                query = dl.insertTimecard(temp);
                jsonObj = {};

                query.then(tc => {
                    console.log(tc);
                    if(tc!=null) {
                        jsonObj = {
                            timecard_id: tc.timecard_id,
                            start_time: tc.start_time,
                            end_time: tc.end_time,
                            emp_id: tc.emp_id
                        }
                        console.log(jsonObj);
                        return res.status(200).json({success:jsonObj});
                    } else {
                        return res.status(400).json({
                            error: `could not insert new timecard`
                        });
                    }
                });
            } else {
                return res.status(400).json({
                    error: `could not insert new timecard: employee doesn't exist`
                });
            }
        });
    } else {
        return res.status(400).json({
            error: "timecard date(s) invalid",
        });
    }
});

app.put(`${PATH}/timecard`, urlencodeParser, async (req,res) => {
    const comp = req.body.company;
    const timecard_id = parseInt(req.body.timecard_id);
    const emp_id = parseInt(req.body.emp_id);
    const start_time = req.body.start_time;
    const end_time = req.body.end_time;
    console.log(`comp: ${comp}, timecard_id: ${timecard_id}, emp_id: ${emp_id}, start_time: ${start_time}, end_time: ${end_time}`);

    //validation start/end time
    timecardDatesValid = Boolean(areTimecardDatesValid(start_time,end_time));
    console.log(`timecardDatesValid: ${timecardDatesValid}`);

    if (timecardDatesValid) {
        //validate that timecard exists
        query = dl.getTimecard(timecard_id);
        console.log(`getTimecard(${timecard_id})`);

        query.then(tc => {
            console.log(tc);

            if(tc!=null) {
                //exists, delete old tc, make a new one
                rowsAffected = dl.deleteTimecard(tc.timecard_id);
                console.log(`tc exists, deleteTimecard(${tc.timecard_id})`);

                temp = new dl.Timecard(start_time, end_time, emp_id);
                query = dl.insertTimecard(temp);
                jsonObj = {};

                query.then(tc => {
                    console.log(tc);
                    if(tc!=null) {
                        jsonObj = {
                            timecard_id: tc.timecard_id,
                            start_time: tc.start_time,
                            end_time: tc.end_time,
                            emp_id: tc.emp_id
                        }
                        console.log(jsonObj);
                        return res.status(200).json({success:jsonObj});
                    } else {
                        return res.status(400).json({
                            error: `could not insert new timecard`
                        });
                    }
                });

            } else {
                return res.status(400).json({
                    error: `could not delete previous record to update timecard`
                });
            }
        });
    } else {
        return res.status(400).json({
            error: "timecard date(s) invalid",
        });
    }
});

app.delete(`${PATH}/timecard`, async (req, res) => {
    const comp = req.query.company;
    const timecard_id = parseInt(req.query.timecard_id);
    console.log(`$company: ${comp}, timecard_id: ${timecard_id}`);

    query = dl.deleteTimecard(timecard_id);
    query.then(affectedRows => {
        console.log(`affectedRows: ${affectedRows}`);
        if(affectedRows>0) {
            return res.status(200).json({success:`timecard deleted`});
        } else {
            return res.status(400).json({
                error: `could not delete timecard`
            });
        }
    });
});

app.listen(8080);
console.log('Express started on port 8080');