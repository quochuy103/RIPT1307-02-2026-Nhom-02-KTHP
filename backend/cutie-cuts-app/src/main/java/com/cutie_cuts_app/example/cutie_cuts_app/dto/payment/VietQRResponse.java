package com.cutie_cuts_app.example.cutie_cuts_app.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;

public class VietQRResponse {
    private String code;
    private String desc;

    @JsonProperty("data")
    private VietQRData data;

    public VietQRResponse() {
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    public VietQRData getData() {
        return data;
    }

    public void setData(VietQRData data) {
        this.data = data;
    }

    public static class VietQRData {
        private String qrCode;
        private String qrDataURL;

        public VietQRData() {
        }

        public String getQrCode() {
            return qrCode;
        }

        public void setQrCode(String qrCode) {
            this.qrCode = qrCode;
        }

        public String getQrDataURL() {
            return qrDataURL;
        }

        public void setQrDataURL(String qrDataURL) {
            this.qrDataURL = qrDataURL;
        }
    }
}
