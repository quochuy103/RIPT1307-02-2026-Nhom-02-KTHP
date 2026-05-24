package com.cutie_cuts_app.example.cutie_cuts_app.dto.payment;

public class VietQRRequest {
    private String accountNo;
    private String accountName;
    private Long acqId;
    private Integer amount;
    private String addInfo;
    private String format;
    private String template;

    public VietQRRequest() {
    }

    public String getAccountNo() {
        return accountNo;
    }

    public void setAccountNo(String accountNo) {
        this.accountNo = accountNo;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public Long getAcqId() {
        return acqId;
    }

    public void setAcqId(Long acqId) {
        this.acqId = acqId;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public String getAddInfo() {
        return addInfo;
    }

    public void setAddInfo(String addInfo) {
        this.addInfo = addInfo;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getTemplate() {
        return template;
    }

    public void setTemplate(String template) {
        this.template = template;
    }
}
