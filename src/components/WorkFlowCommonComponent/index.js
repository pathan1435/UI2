import React from 'react';
import LinkData from '../CommonLinksData'
import CommanCheckList from '../CommonCheckList';
import CommanPlanningTable from '../CommonScrumPlanningTable'
import actorsImg from '../../img/actors-img.png'
import { cloneDeep } from 'lodash';
import CommonMatrixViewComponent from '../CommonMatrixViewComponent';
import { UsersList, StageStatus } from '../../commonDS';
class WorkFlow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      usecaseData: {},
      activeStage: 0,
      toggleMatrix: false,
      userList: UsersList,
      activeModelName: '',
      activeUseCaseIndex: 0,
      editformData: '',
      initalStateUsecaseDevelopment: {},
      createUsecase: false,
      uploadScreenshot: false
    };
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.props.selectedUseCaseData !== prevProps.selectedUseCaseData) {
      this.setState({ initalStateUsecaseDevelopment: cloneDeep(this.props.selectedUseCaseData.stepinput.stages[0].usecaseDevelopment) })
      this.setState({
        toggleMatrix: false,
        usecaseData: cloneDeep(this.props.selectedUseCaseData),
        activeStage: this.state.activeStage ? this.state.activeStage : this.props.activeStage,
        editformData: this.props.editFormData
      })
    }
  }
  getUsecaseStageData = (data, index) => {
    if (index > 0) {
      this.setState({
        createUsecase: false,
        uploadScreenshot: false
      })
    }
    this.setState({
      activeStage: index,

    });
  };

  displayWorkflowStage = () => {
    const { activeStage, usecaseData } = this.state;
    let retData = [];
    if (usecaseData?.stepinput?.stages?.length && usecaseData.stepinput.stages.length > 0) {
      for (let i = 0; i < usecaseData.stepinput.stages.length; i++) {
        let row = usecaseData.stepinput.stages[i];
        let status = (row) => {
          if (row.status) {
            return row.status
          }
          else if (row.workflowCheckList.length > 0 && !row.status) {
            let status = 0;
            let workflowCheckList = row.workflowCheckList
            for (let value of workflowCheckList) {
              if (value.checked) {
                status++
              }
            }
            if (status === row.workflowCheckList.length) {
              return StageStatus.COMPLETED;
            }
            else if (status > 0 && status < row.workflowCheckList.length) {
              return StageStatus.INPROGRESS;
            }
            else {
              return StageStatus.TODO;
            }
          }

        }
        retData.push(
          <React.Fragment key={`${i}_workflow_checklist_status`}>
            <li
              onClick={() => this.getUsecaseStageData(row, i)}
              className={
                status(row)
              }
            >
              <span>{i + 1}</span>
              <div className={i == activeStage ? 'active form-control' : 'form-control'}>
                <input
                  type="text"
                  value={row.name}
                  name="name"
                  onChange={(e) => this.handleStageChange(e, i)}
                  readOnly
                />
              </div>
            </li></React.Fragment>
        );
      }
    }

    return retData;
  };

  handleStageChange = (e, index) => {
    const { editFormData } = this.props
    if (!editFormData) {
      const { usecaseData } = this.state;
      const { name, value } = e.target;
      let stages = usecaseData.stages;
      if (usecaseData.stages) {
        stages[index][name] = value;
      }
    }
  };

  handleStateChange = (event, index) => {
    const { editFormData } = this.props
    if (!editFormData) {
      const { usecaseData, activeStage } = this.state;
      const { name, value } = event.target;
      const workflowDetail = usecaseData.stepinput.stages[activeStage];
      if (workflowDetail.details) {
        workflowDetail.details[index].data[0][name] = value;
      }
      this.setState({
        usecaseData: usecaseData
      });
    }
  };

  handleStateChangeCheckList = (e, index) => {
    const { editFormData } = this.props
    if (!editFormData) {
      const { checked } = e.target;
      const { usecaseData, activeStage } = this.state;
      let count = 0;
      const workflowDetail = usecaseData.stepinput.stages[activeStage];
      if (workflowDetail.workflowCheckList) {
        workflowDetail.workflowCheckList[index]['checked'] = checked;
        for (let i = 0; i < workflowDetail.workflowCheckList.length; i++) {
          if (workflowDetail.workflowCheckList[i].checked) {
            count++;
          }
        }
      }
      if (count == workflowDetail.workflowCheckList.length) {
        usecaseData.stepinput.stages[activeStage]['status'] = StageStatus.COMPLETED;
      } else if (count > 0 && count < workflowDetail.workflowCheckList.length) {
        usecaseData.stepinput.stages[activeStage]['status'] = StageStatus.INPROGRESS;
      } else if (count == 0) {
        usecaseData.stepinput.stages[activeStage]['status'] = StageStatus.TODO;
      }
      this.setState({
        usecaseData
      });
      this.updateForm(usecaseData)
    }
  };

  update1Form = async (data) => {
    await this.updateForm(data);
    await this.addgit();
  };
  
  updateForm = (data) => {
    const { activeStage, usecaseData } = this.state;
    this.props.updateStep(data, activeStage);
    this.setState({
      initalStateUsecaseDevelopment: usecaseData.stepinput.stages[0].usecaseDevelopment,
      createUsecase: false,
      uploadScreenshot: false,
    });
  };
  
  addgit = async () => {
    const { initalStateUsecaseDevelopment } = this.state;
    const jsonParams = initalStateUsecaseDevelopment;
    const mdContent = 'Your Markdown content goes here'; // Replace with your actual Markdown content
    await this.addgitfile(jsonParams, mdContent);
  };
  
  addgitfile = async (params, mdContent) => {
    const octokit = new Octokit({
      auth: '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',
    });
  
    try {
      // Update JSON file
      const { data: jsonFile } = await octokit.rest.repos.getContent({
        owner: 'pathankaif1435',
        repo: 'pathankaif1435',
        path: 'data.json', // Change the file path as needed
      });
  
      const jsonSha = jsonFile.sha;
      const existingJsonContent = atob(jsonFile.content);
      const newJsonData = JSON.stringify(params);
      const updatedJsonContent = existingJsonContent + newJsonData;
  
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'pathankaif1435',
        repo: 'pathankaif1435',
        path: 'data.json', // Change the file path as needed
        message: 'Update JSON file',
        content: btoa(updatedJsonContent),
        sha: jsonSha,
      });
  
      // Update Markdown file
      const { data: mdFile } = await octokit.rest.repos.getContent({
        owner: 'pathankaif1435',
        repo: 'pathankaif1435',
        path: 'file.md', // Change the file path as needed
      });
  
      const mdSha = mdFile.sha;
      const existingMdContent = atob(mdFile.content);
      const updatedMdContent = existingMdContent + mdContent;
  
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'pathankaif1435',
        repo: 'pathankaif1435',
        path: 'file.md', // Change the file path as needed
        message: 'Update Markdown file',
        content: btoa(updatedMdContent),
        sha: mdSha,
      });
  
      console.log('Files updated successfully');
    } catch (error) {
      console.error('Error updating files:', error);
    }
  };
  

  moveToNextPage = (type) => {
    const { usecaseData, activeStage } = this.state;
    if (type === 'next') {
      if (
        usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0 &&
        usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > activeStage
      ) {
        this.setState((prevState) => ({
          activeStage: prevState.activeStage + 1,
        }));
      }
    } else {
      if (usecaseData && usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0) {
        let index = activeStage - 1;
        this.setState({
          activeStage: index < 0 ? 0 : index,
        });
      }
    }
  };

  // moveToNextPage = (type) => {
  //   const { usecaseData, activeStage } = this.state;
  //   if (type == 'next') {
  //     if (usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0 && usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length! > activeStage
  //     ) {
  //       this.setState({
  //         activeStage: activeStage + 1
  //       });
  //     }
  //   } else {
  //     if (usecaseData && usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0) {
  //       let index = activeStage - 1;
  //       this.setState({
  //         activeStage: index
  //       });
  //     }
  //   }
  // };

  displayUseCaseList = () => {
    const { useCaseList, activeUseCaseIndex } = this.state;
    let retData = [];
    if (useCaseList && useCaseList.length > 0) {
      for (let i = 0; i < useCaseList.length; i++) {
        retData.push(
          <React.Fragment key={`${i}_active_usecase`}>
            <li className={i == activeUseCaseIndex ? "active" : ''} onClick={() => this.setUseCaseData(i)}>
              {/* <Link to="/"> */}
              <span>{useCaseList[i].usecaseName}</span>
              {/* </Link> */}
            </li></React.Fragment>
        )
      }
    }
    return retData;
  }
  setUseCaseData = (index) => {
    const { useCaseList, } = this.state
    let data = useCaseList[index]
    if (data && data.stepinput && data.stepinput.S) {
      data = data.stepinput.S;
      this.setState({ usecaseData: data.stages })
    }
    this.setState({ activeUseCaseIndex: index })

  }
  createUsecase = () => {
    this.setState({
      createUsecase: true
    });
  }
  createUsecaseClose = () => {
    this.resetInitalStateUsecaseDevelopment()
    this.setState({
      createUsecase: false
    });
  }
  resetInitalStateUsecaseDevelopment = () => {
    const { initalStateUsecaseDevelopment, usecaseData } = this.state
    usecaseData.stepinput.stages[0].usecaseDevelopment = cloneDeep(initalStateUsecaseDevelopment)
    this.setState({ usecaseData, })
  }
  uploadScreenshot = () => {
    this.setState({
      uploadScreenshot: true
    });
  }
  uploadScreenshotClose = () => {
    this.resetInitalStateUsecaseDevelopment()
    this.setState({
      uploadScreenshot: false
    });
  };

  handleSelectActors = (e, index) => {
    const { name, checked } = e.target;
    const { usecaseData } = this.state;
    usecaseData.stepinput.stages[0].usecaseDevelopment[name][index].isChecked = checked
    this.setState(usecaseData)
  };

  handleusecaseDevelopmentState = (e) => {
    const { name, value } = e.target;
    const { usecaseData } = this.state;
    usecaseData.stepinput.stages[0].usecaseDevelopment[name] = value
    this.setState(usecaseData)
  }
  handleSpecsFiles = (e) => {
    const { usecaseData } = this.state;
    const { name, files } = e.target
    usecaseData.stepinput.stages[0].usecaseDevelopment[name].push(files[0])
    this.setState(usecaseData)
  }

  handleDeleteImage = (index) => {
    const { usecaseData } = this.state;
    let usecaseDevelopment = usecaseData?.stepinput?.stages[0]?.usecaseDevelopment ? usecaseData.stepinput.stages[0].usecaseDevelopment : {}
    usecaseDevelopment.specs.splice(index, 1);
    this.setState(usecaseData);
  }
  handleDisplayMatrixView = (modelName) => {
    let { activeModelName, toggleMatrix } = this.state;
    activeModelName = modelName ? modelName : ''
    this.setState({
      toggleMatrix: !toggleMatrix, activeModelName
    })
  };

  render() {
    const { activeStage, usecaseData, userList, toggleMatrix, activeModelName, editformData, createUsecase, uploadScreenshot } = this.state;
    let usecaseDevelopment = usecaseData?.stepinput?.stages[0]?.usecaseDevelopment ? usecaseData.stepinput.stages[0].usecaseDevelopment : {}
    return (<React.Fragment>{!toggleMatrix ?
      <div className="project-over-view-right-content">
        <div className="workflow-stage">
          {usecaseData?.stepinput?.stages?.length && usecaseData.stepinput.stages.length > 0 && <ul>{this.displayWorkflowStage()}</ul>}
        </div>
        {createUsecase === true ?
          <div className="workflow-inner-data-contant">
            <div className="usecase-form">
              <div className="heading">
                <span>Requirement Sub-Stage details</span>
                <button className="btn btn-close" onClick={() => this.createUsecaseClose()}>
                  <i className="fa fa-close"></i>
                </button>
              </div>
              <div className="form-group row">
                <label className="col-lg-2 col-sm-12 col-form-label">Usecase Name</label>
                <div className="col-lg-10 col-sm-12">
                  <input className="form-control" name="usecaseName" value={usecaseDevelopment.usecaseName}
                    onChange={(e) => { this.handleusecaseDevelopmentState(e) }} disabled={editformData} type="text" placeholder="" />
                </div>
              </div>
              <div className="form">
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Usecase Name</label>
                  <div className="col-lg-10 col-sm-12">
                    <input className="form-control" name="usecaseName" value={usecaseDevelopment.usecaseName} onChange={(e) => this.handleusecaseDevelopmentState(e)} disabled={editformData} type="text" placeholder="" />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Select Actors</label>
                  <div className="col-lg-10 col-sm-12">
                    <div className='row'>
                      {/* <div className="col-lg-3 col-md-4 col-sm-6"> */}
                      {usecaseData?.stepinput?.stages[0]?.usecaseDevelopment?.selectActors.length > 0 ?
                        usecaseData.stepinput.stages[0].usecaseDevelopment.selectActors.map((val, index) => (
                          <div className="col-lg-4 col-md-4 col-sm-6" key={`${index}_select_actor`}>
                            <div className="select-actors">
                              <input className="form-check-input" key={val.key} name="selectActors"
                                onChange={(e) => this.handleSelectActors(e, index)} disabled={editformData} type="checkbox" checked={val.isChecked} id="defaultCheck1" />
                              <div className="image">
                                <img src={actorsImg} alt='' />
                              </div>
                              <div className="name">{val.name}</div>
                            </div>
                          </div>)) : <></>
                      }
                    </div>
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Usecase Description</label>
                  <div className="col-lg-10 col-sm-12">
                    <textarea className="form-control" name="description" value={usecaseDevelopment.description} onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} placeholder="" rows={2} />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Tigger</label>
                  <div className="col-lg-10 col-sm-12">
                    <input className="form-control" name="tigger" value={usecaseDevelopment.tigger} onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} type="text" placeholder="" />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Pre-conditions</label>
                  <div className="col-lg-10 col-sm-12">
                    <input className="form-control" name="preConditions" value={usecaseDevelopment.preConditions} onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} type="text" placeholder="" />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Post-conditions</label>
                  <div className="col-lg-10 col-sm-12">
                    <textarea className="form-control" name="postConditions" value={usecaseDevelopment.postConditions} onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} placeholder="" rows={2} />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-lg-2 col-sm-12 col-form-label">Usecase Flow</label>
                  <div className="col-lg-10 col-sm-12">
                    <textarea className="form-control" name='usecaseFlow' value={usecaseDevelopment.usecaseFlow} onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} placeholder="" rows={4} />
                  </div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-12 text-right">
                    <button className="btn btn-primary save-btn" onClick={() => this.update1Form(usecaseData)}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
          : ""
        }
        {uploadScreenshot ?
          <div className="workflow-inner-data-contant">
            <div className="usecase-form">
              <div className="heading">
                <span>Requirement Sub-Stage details</span>
                <button className="btn btn-close" onClick={() => this.uploadScreenshotClose()}>
                  <i className="fa fa-close"></i>
                </button>
              </div>
              <div className="form">
                <div className="form-group row">
                  <label className="col-lg-3 col-sm-12 col-form-label">Usecase Design Prototype Link</label>
                  <div className="col-lg-9 col-sm-12">
                    <input className="form-control" name="prototypeLink" value={usecaseDevelopment.prototypeLink}
                      onChange={(e) => this.handleusecaseDevelopmentState(e)} readOnly={editformData} type="text" placeholder="" />
                  </div>

                </div>
                <div className="form-group row">
                  <label className="col-lg-3 col-sm-12 col-form-label">Usecase Design Screenshots</label>
                  <div className="col-lg-4 col-sm-12">
                    <div className="upload-screenshots">
                      <input type="file" id="file" name="specs" onChange={(e) => this.handleSpecsFiles(e)} readOnly={editformData} className="form-control-file" />
                      <button className="btn btn-primary btn-upload" type="button">
                        <i className="fa fa-plus"></i> Add more Screenshots
                      </button>
                    </div>
                  </div>
                  <div className="col-lg-5 col-sm-12 text-right">
                    <button className="btn btn-primary btn-upload" type="button">
                      Save
                    </button>
                  </div>
                </div>
                <div className="form-group row">
                  {usecaseDevelopment && usecaseDevelopment.specs && usecaseDevelopment.specs.length > 0 ?
                    usecaseDevelopment.specs.map((value, index) => (
                      <div className="screenshot-box" key={`${index}_usecase_devlopement_specs`}>
                        <div className="screenshot ">
                          <img src={URL.createObjectURL(value)} alt="" />
                        </div>
                        <i className="fa fa-close" onClick={() => this.handleDeleteImage(index)}></i>
                      </div>)
                    ) : <></>
                  }
                </div>
              </div>
            </div>
          </div>
          : ""
        }
        {createUsecase === false && uploadScreenshot === false ?
          <>
            <div className="workflow-inner-data-contant">
              <div className="workflow-data">
                {activeStage === 0 ? <React.Fragment>
                  <div className="api-code">
                  </div>
                  <div className="api-code">
                    <div className="heading">
                      <h5>{'Usecase Development'}</h5>
                      <i className="fa fa-angle-down" aria-hidden="true"></i>
                    </div>
                    <div className="api-content">
                      <button className="btn btn-primary usecase-btn" onClick={() => this.createUsecase()}>
                        Create Usecase
                      </button>
                      <button className="btn btn-primary usecase-btn" onClick={() => this.handleDisplayMatrixView("usecaseDevelopment")}>
                        View Details
                      </button>
                    </div>
                  </div>
                  <div className="api-code">
                    <div className="heading">
                      <h5>{'Design Specs'}</h5>
                      <i className="fa fa-angle-down" aria-hidden="true"></i>
                    </div>
                    <div className="api-content">
                      <button className="btn btn-primary usecase-btn" onClick={() => this.uploadScreenshot()}>
                        Upload
                      </button>
                      <button className="btn btn-primary usecase-btn" onClick={() => this.handleDisplayMatrixView("designSpecs")} >
                        View Details
                      </button>
                    </div>
                  </div></React.Fragment> : ""}
                {editformData !== "" && <LinkData disabledEditForm={editformData}
                  handleStateChange={this.handleStateChange} updateStep={this.updateForm} usecaseData={usecaseData} activeStage={activeStage} />}
              </div>
              {activeStage === 0 ? <div className="workflow-view-table-section">
                <div className='heading'>
                  <h5>SCRUM Planning</h5>
                  <i className="fa fa-angle-down" aria-hidden="true"></i>
                </div>
                <div className="workflow-view-table">
                  <table className="table">
                    <thead >
                      <tr>
                        <th>Stages</th>
                        <th>Assigned to</th>
                        <th>Start Date</th>
                        <th>Deviation</th>
                        <th>End Date</th>
                        <th>Deviation</th>
                      </tr>
                    </thead>
                    {usecaseData && usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0 ?
                      <tbody><CommanPlanningTable props={{ handleStateChange: this.handleStateChange, usecaseData, disabledEditForm: editformData, userList: userList, activeStage, ...this.props }} />
                      </tbody> : <React.Fragment></React.Fragment>}
                  </table>
                </div>
              </div> : <React.Fragment></React.Fragment>}
              <div className="workflow-requirement">
                <div className="heading">
                  <h5>Checklist for Requirements</h5>
                </div>
                {editformData !== "" && usecaseData?.stepinput?.stages[activeStage]?.workflowCheckList?.length > 0 ? <React.Fragment>
                  <CommanCheckList usecaseData={usecaseData}
                    activeStage={activeStage} handleStateChangeCheckList={this.handleStateChangeCheckList}
                    disabledEditForm={editformData} />
                </React.Fragment> : <React.Fragment></React.Fragment>}
              </div>
              <div className="workflow-buttons">
                <button
                  type="button"
                  disabled={activeStage == 0}
                  className="btn btn-primary previous-btn"
                  onClick={() => this.moveToNextPage('previous')}
                >
                  Previous
                </button>
                {usecaseData && (
                  <button
                    type="button"
                    disabled={usecaseData?.stepinput?.stages.length - 1 === activeStage}
                    className="btn btn-primary previous-btn next-btn"
                    onClick={() => this.moveToNextPage('next')}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
          : ""
        }

      </div> : <React.Fragment>
        {usecaseDevelopment && usecaseData ? <CommonMatrixViewComponent activeMatrixData={usecaseDevelopment} usecasename={usecaseData.usecasename ? usecaseData.usecasename : usecaseData.usecaseName} activeModelName={activeModelName} handleDisplayMatrixView={this.handleDisplayMatrixView} /> : <></>}</React.Fragment>}
    </React.Fragment>)
  }
}
export default WorkFlow;