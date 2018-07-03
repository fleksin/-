import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormControl, Grid, Row, Col, Jumbotron, Tabs, Tab, Tooltip, OverlayTrigger, Collapse } from 'react-bootstrap';

const ACCEPT_FEE_UNDER1M = {
  name: 'ACCEPT_FEE_UNDER1M',
  overFlowRate: 0.005,
  model: [
    {
      floor: 0,
      roof: 1000,
      fixedFee: 100,
    },
    {
      floor: 1000,
      roof: 50000,
      rate: 0.05,
    },
    {
      floor: 50000,
      roof: 100000,
      rate: 0.04,
    },
    {
      floor: 100000,
      roof: 200000,
      rate: 0.03,
    },
    {
      floor: 200000,
      roof: 500000,
      rate: 0.02,
    },
    {
      floor: 500000,
      roof: 1000000,
      rate: 0.01,
    },
  ],
};

const PROCESS_FEE_UNDER1M = {
  name: 'PROCESS_FEE_UNDER1M',
  overFlowRate: 0.001,
  model: [
    {
      floor: 0,
      roof: 50000,
      fixedFee: 1000,
    },
    {
      floor: 50000,
      roof: 200000,
      rate: 0.015,
    },
    {
      floor: 200000,
      roof: 500000,
      rate: 0.0065,
    },
    {
      floor: 500000,
      roof: 1000000,
      rate: 0.0035,
    },
  ]
};
const DISPUTED_FEE_OVER1M = {
  name: 'DISPUTED_FEE_OVER1M',
  overFlowRate: 0.005,
  model: [
    {
      floor: 0,
      roof: 50000,
      fixedFee: 1050
    },
    {
      floor: 50000,
      roof: 100000,
      rate: 0.025
    },
    {
      floor: 100000,
      roof: 200000,
      rate: 0.02
    },
    {
      floor: 200000,
      roof: 500000,
      rate: 0.015
    },
    {
      floor: 500000,
      roof: 1000000,
      rate: 0.01
    },
    {
      floor: 1000000,
      roof: 2000000,
      rate: 0.009
    },
    {
      floor: 2000000,
      roof: 5000000,
      rate: 0.008
    },
    {
      floor: 5000000,
      roof: 7650000,
      rate: 0.007
    },
    {
      floor: 7650000,
      roof: 20000000,
      rate: 0.0058
    },
  ]
};

export default class Login extends Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired
  };

  state = {
    username: '',
    number: '',
    tabKey: 1,
    acceptFeeUnder1m: null,
    processFeeUnder1m: null,
    chargeFeeOver1m: null,
    acceptFeeUnder1mOpen: false,
    processFeeUnder1mOpen: false,
    chargeFeeOver1mOpen: false,
    formula: {},
  };

  handleLogin = () => {
    this.props.onLogin({
      username: this.state.username,
      loggedIn: true
    });
  }

  handleChange = (e) => {
    const number = e.target.value;
    const { fee: acceptFeeUnder1m, formulaArr: formula1 } = this.calculateFee(number, ACCEPT_FEE_UNDER1M);
    const { fee: processFeeUnder1m, formulaArr: formula2 } = this.calculateFee(number, PROCESS_FEE_UNDER1M);
    const { fee: chargeFeeOver1m, formulaArr: formula3 } = this.calculateFee(number, DISPUTED_FEE_OVER1M);
    this.setState({
      number,
      acceptFeeUnder1m,
      processFeeUnder1m,
      chargeFeeOver1m,
      formula: {
        acceptFeeUnder1m: formula1,
        processFeeUnder1m: formula2,
        chargeFeeOver1m: formula3,
      }
    });
  }

  onSelect = (value) => {
    this.setState({
      tabKey: value,
    });
  }

  calculateFee = (_amount, { model, overFlowRate }) => {
    let fee = 0;
    const amount = parseFloat(_amount);
    let whatsLeft = amount;
    const formulaArr= [];
    for (const item of model) {
      const { roof, floor, rate, fixedFee } = item;
      if (amount <= roof) {
        const actualCharge = fixedFee || whatsLeft * rate;
        fee += actualCharge;
        if (whatsLeft !== amount - floor) {
          console.error('我这么数字对不上，你那边肯定有问题');
        }
        formulaArr.push({
          ...item,
          roof: amount,
          actualCharge,
        });
        whatsLeft = 0;
        break;
      }
      const actualCharge = fixedFee || (roof - floor) * rate;
      fee += actualCharge;
      formulaArr.push({
        ...item,
        actualCharge,
      });
      whatsLeft = whatsLeft - (roof - floor);
      if (whatsLeft !== amount - roof) {
        console.error('我这么数字对不上，你那边肯定有问题');
      }
    }
    if (whatsLeft > 0 && overFlowRate) {
      const overFlowBar = model[model.length - 1].roof;
      const actualCharge = whatsLeft * overFlowRate;
      fee += actualCharge;
      formulaArr.push({
        floor: overFlowBar,
        roof: overFlowBar + whatsLeft,
        rate: overFlowRate,
        actualCharge,
      });
    }
    return {
      fee,
      formulaArr,
    };
  }

  toggleCollapse(name) {
    const { state } = this;
    state[name] = !state[name];
    this.setState({
      ...state,
    });
  }

  render() {
    const { acceptFeeUnder1m, processFeeUnder1m, chargeFeeOver1m, number, formula } = this.state;

    const mapFunc = (item, index) => {
      const { floor, roof, rate, actualCharge, fixedFee } = item;
      return (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip key={item} id="tooltip" >
              <div className="customTooltip">
                <p>{floor}元 ~ {roof}元:</p>
                {
                  fixedFee ?
                    fixedFee
                    :
                    `${roof - floor} x ${(rate * 100).toFixed(2)}%`
                }
              </div>
            </Tooltip>
          }
          key={`${item}-${index}`}
        >
          <p className="customParagraph">
            {index > 0 ? '+ ' : null}
            {actualCharge.toFixed(2)}&nbsp;
          </p>
        </OverlayTrigger>
      );
    };

    const sum = (acceptFeeUnder1m+processFeeUnder1m).toFixed(2);
    const acceptFeeRatio = (acceptFeeUnder1m / sum).toFixed(2);
    const processFeeRatio = (processFeeUnder1m / sum).toFixed(2);

    return (
      <Grid>
        <Row className="customRow">
          <Col xs={12} >
            <h2>输入争议金额</h2>
            <FormControl type="text" value={this.state.number} onChange={this.handleChange} />
            {/* <br/><Button onClick={this.handleLogin}>计算</Button> */}
          </Col>
          <Col xs={12} className="resultArea">
            <Tabs activeKey={this.state.tabKey} onSelect={this.onSelect} id="test">
              <Tab title="标的额小于100万" eventKey={1} >
                <Jumbotron className="resultArea">
                  {
                    number ?
                      <Row>
                        <Col xs={6}>
                          <div>
                            <h2>案件受理费</h2>
                            <h3>{acceptFeeUnder1m.toFixed(2)}元</h3>
                            <a onClick={this.toggleCollapse.bind(this, 'acceptFeeUnder1mOpen')}>显示公式</a>
                            <Collapse in={this.state.acceptFeeUnder1mOpen}>
                              <div>{formula.acceptFeeUnder1m.map(mapFunc)}</div>
                            </Collapse>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div>
                            <h2>案件处理费</h2>
                            <h3>{processFeeUnder1m.toFixed(2)}元</h3>
                            <a onClick={this.toggleCollapse.bind(this, 'processFeeUnder1mOpen')}>显示公式</a>
                            <Collapse in={this.state.processFeeUnder1mOpen}>
                              <div>{formula.processFeeUnder1m.map(mapFunc)}</div>
                            </Collapse>
                          </div>
                        </Col>
                        <Col xs={12}>
                          <h3>合计: {sum} 元 </h3>
                          {/* <h4>
                            案件受理费 {acceptFeeRatio * 100}%  案件处理费 {processFeeRatio * 100}%
                          </h4> */}
                        </Col>
                      </Row>
                      :
                      <p>请输入金额</p>
                  }
                </Jumbotron>
              </Tab>
              <Tab title="标的额大于100万" eventKey={2} >
                <Jumbotron className="resultArea">
                  {
                    number ?
                      <Row>
                        <Col xs={12}>
                          <h2>仲裁收费</h2>
                          <h3>{chargeFeeOver1m.toFixed(2)}元</h3>
                          <a onClick={this.toggleCollapse.bind(this, 'chargeFeeOver1mOpen')}>显示公式</a>
                          <Collapse in={this.state.chargeFeeOver1mOpen}>
                            <div>{formula.chargeFeeOver1m.map(mapFunc)}</div>
                          </Collapse>
                        </Col>
                        <Col xs={12}>
                          <h4>
                            案件受理费: {(acceptFeeRatio * 100).toFixed(2)}% - {(acceptFeeRatio * chargeFeeOver1m).toFixed(2)}元
                          </h4>
                          <h4>
                            案件处理费: {(processFeeRatio * 100).toFixed(2)}% - {(processFeeRatio * chargeFeeOver1m).toFixed(2)}元 
                          </h4>
                        </Col>
                      </Row>
                      :
                      <p>请输入金额</p>
                  }
                </Jumbotron>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Grid>
    );
  }
}
