import React, { useEffect, useRef, useState } from 'react';
import {
	Button,
	Box,
	Field,
	Grid,
	Toggle,
} from '@strapi/design-system';
import { Page, Layouts } from '@strapi/strapi/admin';
import { Check } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { PluginSettingsResponse } from '../../../typings';
import { useIntl } from 'react-intl';
import { getTranslation as getTrad } from '../utils/getTranslation';
import SettingsTextField from '../components/SettingsTextField';

const Settings = () => {
	const { formatMessage } = useIntl();

	const isMounted = useRef(true);
	const { get, post } = useFetchClient();

	const defaultSettingsBody: PluginSettingsResponse | null = null;
	const [settings, setSettings] = useState<PluginSettingsResponse | null>(defaultSettingsBody);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const { toggleNotification } = useNotification();

	useEffect(() => {
		const fetchData = async () => {
			const { data } = await get<PluginSettingsResponse>(`/multi-select-filter/settings`);
			setSettings(data);

			setIsLoading(false);
		}
		fetchData();

		// unmount
		return () => {
			isMounted.current = false;
		};
	}, []);

	const onUpdateSettings = (fieldName: string, value: string | boolean) => {
		if (!settings)
			return;

		try {
			const updatedSettings = { ...settings };
			(updatedSettings as any)[fieldName] = value;
			setSettings(updatedSettings);
		} catch (e) {
			console.log(e);
		}
	}

	const checkFormErrors = () => {
		const defaultEntityUid = settings?.defaultEntityUid ?? "";
		//const defaultApiEndpoint = settings?.defaultApiEndpoint ?? "";
		return !defaultEntityUid;
	}

	const hasFormError = checkFormErrors();

	const onSubmit = async () => {
		if (!settings)
			return;

		setIsSaving(true);

		const res = await post(`/multi-select-filter/settings`, {
			method: 'POST',
			body: settings
		});
		setSettings(res.data);
		setIsSaving(false);

		toggleNotification({
			type: 'success',
			message: formatMessage({
				id: 'plugin.settings.updated',
				defaultMessage: 'Settings successfully updated',
			}),
		});
	};

	if (isLoading || !settings)
		return <></>;

	return (
		<>
			<Layouts.Header
				id="title"
				title={formatMessage({ id: getTrad("plugin.settings.info.title") })}
				primaryAction={
					isLoading ? (<></>) : (
						<Button
							onClick={onSubmit}
							startIcon={<Check />}
							size="L"
							disabled={isSaving || hasFormError}
							loading={isSaving}
						>
							{formatMessage({ id: getTrad("plugin.settings.buttons.save") })}
						</Button>
					)
				}
			>
			</Layouts.Header>
			<Layouts.Content>
				{(isLoading || !settings) ? (
					<Page.Loading />
				) : (
					<>
						<Grid.Root gap={6}>
							<Grid.Item col={6} s={12}>
								<Box padding={2} style={{ width: "100%" }}>
									<Field.Root name="field_defaultEntityUid">
										<Field.Label>
											{formatMessage({ id: getTrad('plugin.settings.fields.defaultEntityUid.label') })}
										</Field.Label>
										<SettingsTextField hasTooltip={true}
											fieldName="defaultEntityUid" displayName="fields.defaultEntityUid" placeholder='Default Entity Uid'
											required={true} updateItem={onUpdateSettings} value={settings?.defaultEntityUid} />
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
							<Grid.Item col={6} s={12}>
								<Box padding={2} style={{ width: "100%" }}>
									<Field.Root name="field_defaultApiEndpoint">
										<Field.Label>
											{formatMessage({ id: getTrad('plugin.settings.fields.defaultApiEndpoint.label') })}
										</Field.Label>
										<SettingsTextField hasTooltip={true}
											fieldName="defaultApiEndpoint" displayName="fields.defaultApiEndpoint" placeholder='Default Api Endpoint'
											required={false} updateItem={onUpdateSettings} value={settings?.defaultApiEndpoint} />
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
							<Grid.Item col={6} s={12}>
								<Box padding={2}>
									<Field.Root name="field_defaultPublishedOnly">
										<Field.Label>
											{formatMessage({ id: getTrad('plugin.settings.fields.defaultPublishedOnly.label') })}
										</Field.Label>
										<Toggle
											checked={settings?.defaultPublishedOnly}
											onLabel={formatMessage({ id: getTrad("plugin.settings.buttons.yes") })}
											offLabel={formatMessage({ id: getTrad("plugin.settings.buttons.no") })}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												onUpdateSettings("defaultPublishedOnly", e.target.checked)
											}
										/>
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
							<Grid.Item col={6} s={12}>
								<Box padding={2}>
									<Field.Root name="field_defaultQueryLimit">
										<Field.Label>
											{formatMessage({ id: getTrad('plugin.settings.fields.defaultQueryLimit.label') })}
										</Field.Label>
										<SettingsTextField hasTooltip={true} type="number"
											fieldName="defaultQueryLimit" displayName="fields.defaultQueryLimit" placeholder='Query limit'
											required={false} updateItem={onUpdateSettings} value={settings?.defaultQueryLimit?.toString() ?? ""} />
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
							<Grid.Item col={6} s={12}>
								<Box padding={2} style={{ width: "100%" }}>
									<Field.Root name="field_updateFieldName">
										<Field.Label>
											{formatMessage({ id: getTrad('plugin.settings.fields.updateFieldName.label') })}
										</Field.Label>
										<SettingsTextField hasTooltip={true}
											fieldName="updateFieldName" displayName="fields.updateFieldName" placeholder='Field Name'
											required={false} updateItem={onUpdateSettings} value={settings?.updateFieldName} />
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
						</Grid.Root>
					</>
				)}
			</Layouts.Content >
		</>
	);
}

export default Settings;