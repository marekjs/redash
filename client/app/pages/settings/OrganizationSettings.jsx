import { get } from "lodash";
import React, { useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

import Button from "antd/lib/button";
import Form from "antd/lib/form";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import LoadingState from "@/components/items-list/components/LoadingState";

import recordEvent from "@/services/recordEvent";
import OrgSettings from "@/services/organizationSettings";
import wrapSettingsTab from "@/components/SettingsWrapper";

import GeneralSettings from "./components/GeneralSettings";
import AuthSettings from "./components/AuthSettings";

function OrganizationSettings({ onError }) {
  const [settings, setSettings] = useState({});
  const [currentValues, setCurrentValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    recordEvent("view", "page", "org_settings");

    let isCancelled = false;

    OrgSettings.get()
      .then(response => {
        if (!isCancelled) {
          const settings = get(response, "settings");
          setSettings(settings);
          setCurrentValues({ ...settings });
          setIsLoading(false);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          onErrorRef.current(error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChange = useCallback(changes => {
    setCurrentValues(currentValues => ({ ...currentValues, ...changes }));
  }, []);

  const handleSubmit = useCallback(
    event => {
      event.preventDefault();
      if (!isSaving) {
        setIsSaving(true);
        OrgSettings.save(currentValues)
          .then(response => {
            const settings = get(response, "settings");
            setSettings(settings);
            setCurrentValues({ ...settings });
          })
          .catch(error => onErrorRef.current(error))
          .finally(() => setIsSaving(false));
      }
    },
    [isSaving, currentValues]
  );

  return (
    <div className="row" data-test="OrganizationSettings">
      <div className="col-md-offset-4 col-md-4">
        {isLoading ? (
          <LoadingState className="" />
        ) : (
          <Form layout="vertical" onSubmit={handleSubmit}>
            <GeneralSettings settings={settings} values={currentValues} onChange={handleChange} />
            <AuthSettings settings={settings} values={currentValues} onChange={handleChange} />
            <Button className="w-100" type="primary" htmlType="submit" loading={isSaving}>
              Save
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}

OrganizationSettings.propTypes = {
  onError: PropTypes.func,
};

OrganizationSettings.defaultProps = {
  onError: () => {},
};

const OrganizationSettingsPage = wrapSettingsTab(
  {
    permission: "admin",
    title: "Settings",
    path: "settings/organization",
    order: 6,
  },
  OrganizationSettings
);

export default routeWithUserSession({
  path: "/settings/organization",
  title: "Organization Settings",
  render: pageProps => <OrganizationSettingsPage {...pageProps} />,
});
