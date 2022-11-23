/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { TektonDashboardFetchComponent } from './TektonDashboardFetchComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { setupRequestMockHandlers, MockConfigApi, renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';
import { Entity, EntityMeta } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react'

const mockEntity = {
  metadata: {
    annotations: {
      'tektonci/build-namespace': 'microservice-build',
      'tektonci/pipeline-label-selector': 'pipeline.jquad.rocks/git.repository.branch.name=main'
    }

  }
}

jest.mock('@backstage/plugin-catalog-react', () => ({
  useEntity: () => mockEntity
}));


describe('TektonDashboardFetchComponent', () => {
  const server = setupServer();
  const mockConfig = new MockConfigApi({
    app: { baseUrl: 'https://example.com' }
  })
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('https://rancher.jquad.rocks/apis/tekton.dev/v1beta1/namespaces/sample-go-aplication-build/pipelineruns*', (_, res, ctx) =>
        res(ctx.status(200), ctx.delay(2000), ctx.json({})),
      ),
    );
  });
  // https://github.com/backstage/backstage/blob/master/plugins/allure/src/components/AllureReportComponent/AllureReportComponent.test.tsx
  it('should render', async () => {
    //  https://backstage.io/docs/reference/test-utils.mockconfigapi
    const rendered = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfig]]}>
        <TektonDashboardFetchComponent />
      </TestApiProvider>
    )
    expect(await rendered.findByTestId('progress')).toBeInTheDocument();
  });
});
